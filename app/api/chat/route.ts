import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-1.5-flash'];

const MAX_BODY_SIZE_MB = 8;
const MAX_BODY_SIZE_BYTES = MAX_BODY_SIZE_MB * 1024 * 1024;

class PayloadTooLargeError extends Error {
  constructor(message = `Request body exceeds ${MAX_BODY_SIZE_MB}MB limit`) {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

class InvalidJsonError extends Error {
  constructor(message = 'Invalid JSON payload') {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

const RETRIABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const MAX_MODEL_RETRIES = 3;

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error: unknown): number | undefined => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return undefined;
};

async function callModelWithRetry<T>(call: () => Promise<T>, modelName: string): Promise<T> {
  let attempt = 0;
  while (attempt < MAX_MODEL_RETRIES) {
    try {
      return await call();
    } catch (error) {
      attempt += 1;
      const status = getErrorStatus(error);
      const shouldRetry =
        attempt < MAX_MODEL_RETRIES &&
        (status === undefined || RETRIABLE_STATUS.has(status));
      console.warn(
        `Gemini API call failed (model ${modelName}, attempt ${attempt}/${MAX_MODEL_RETRIES})`,
        { status, error }
      );
      if (!shouldRetry) {
        throw error;
      }
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      await delay(backoff);
    }
  }
  throw new Error('Exceeded maximum retries for Gemini API call');
}

async function parseRequestBody(request: NextRequest) {
  const contentLengthHeader = request.headers.get('content-length');
  if (
    contentLengthHeader &&
    Number(contentLengthHeader) > MAX_BODY_SIZE_BYTES
  ) {
    throw new PayloadTooLargeError();
  }

  const bodyText = await request.text();

  const encodedLength = new TextEncoder().encode(bodyText).length;
  if (encodedLength > MAX_BODY_SIZE_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!bodyText) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new InvalidJsonError();
  }
}

async function generateResponseWithFallback(prompt: string) {
  let lastError: unknown = null;
  for (const modelName of MODEL_CANDIDATES) {
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await callModelWithRetry(() => model.generateContent(prompt), modelName);
      const response = await result.response;
      const text = response.text();
      return { text, modelName };
    } catch (error) {
      lastError = error;
      console.warn(`Model ${modelName} failed, trying next fallback...`, error);
    }
  }
  throw lastError ?? new Error('All models failed to generate a response');
}

export async function POST(request: NextRequest) {
  let chatId: string | null = null;
  try {
    console.log('=== /api/chat POST endpoint called');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user.id);

    const { message, mode, chatId: bodyChatId, deepSearch } = await parseRequestBody(request) as {
      message?: string;
      mode?: string;
      chatId?: string;
      deepSearch?: boolean;
    };
    chatId = bodyChatId ?? null;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    console.log('Saving user message for chat:', chatId);

    // Find chat by ID only
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      console.error('Chat not found');
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Save user message to database
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        role: 'user',
        chatId,
      },
    });
    
    console.log('User message saved:', userMessage.id);

    // Create context based on selected mode
    let context = '';
    switch (mode) {
      case 'Marketplace':
        context = 'You are an aerospace marketplace expert. Provide insights about aircraft parts, pricing, and market trends.';
        break;
      case 'Inventory':
        context = 'You are an inventory management specialist for aerospace components. Help with stock levels, part numbers, and inventory optimization.';
        break;
      case 'Work Orders':
        context = 'You are a work order management expert for MRO (Maintenance, Repair, and Overhaul) operations.';
        break;
      case 'Compliance':
        context = 'You are a compliance specialist for aerospace regulations and standards (FAA, EASA, etc.).';
        break;
      case 'Financials':
        context = 'You are a financial analyst specializing in aerospace economics and cost management.';
        break;
      case 'Purchasing':
        context = 'You are a procurement specialist for aerospace parts and supplies.';
        break;
      case 'Parts Analyzer':
        context = 'You are a technical expert analyzing aerospace parts, their specifications, and compatibility.';
        break;
      default:
        context = 'You are CortexAI, an intelligent assistant for aerospace and aviation industries.';
    }

    // Add deep search instructions if enabled
    let deepSearchInstructions = '';
    if (deepSearch) {
      deepSearchInstructions = `

DEEP SEARCH MODE ACTIVATED:
- Provide comprehensive, research-level responses with detailed analysis
- Include multiple perspectives and considerations
- Break down complex topics into clear sections
- Cite relevant standards, regulations, or best practices when applicable
- Provide step-by-step explanations for technical topics
- Include examples, use cases, or scenarios where relevant
- Consider safety, compliance, and industry best practices
- Offer actionable insights and recommendations
- Structure your response with clear headings and bullet points for readability
- Go beyond surface-level answers to provide deep, expert-level insights`;
    }

    // Formatting instructions for all responses
    const formattingInstructions = `

RESPONSE FORMATTING GUIDELINES:
- Use proper Markdown formatting for all responses
- Use **bold** for emphasis and important terms
- Use *italics* for technical terms or definitions
- Use \`inline code\` for part numbers, codes, or technical identifiers
- Use code blocks with \`\`\` for multi-line code or technical specifications
- Use # for main headings, ## for subheadings, ### for sub-sections
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequential steps or procedures
- Use > for important notes or warnings
- Use --- for horizontal dividers when separating major sections

TABLE FORMATTING:
- When presenting comparative data, specifications, or structured information, ALWAYS use Markdown tables
- Format tables properly with | separators and alignment
- Example table format:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | Data 1   | Data 2   | Data 3   |
  | Data 4   | Data 5   | Data 6   |
- Use tables for: comparisons, specifications, pricing, schedules, part lists, compliance matrices, etc.
- Align numbers to the right, text to the left in tables

STRUCTURE YOUR RESPONSE:
1. Start with a brief summary or direct answer
2. Provide detailed explanation with proper formatting
3. Use tables when presenting structured data
4. End with actionable recommendations or next steps when applicable`;

    const prompt = `${context}${deepSearchInstructions}${formattingInstructions}\n\nUser: ${message}\n\nProvide a helpful, professional, well-formatted response:`;

    console.log('Calling Gemini API');
    const { text, modelName } = await generateResponseWithFallback(prompt);
    console.log('Gemini response received from model:', modelName);
    
    console.log('Gemini response received');

    // Save assistant message to database
    const assistantMessage = await prisma.message.create({
      data: {
        content: text,
        role: 'assistant',
        chatId,
      },
    });

    console.log('Assistant message saved:', assistantMessage.id);

    return NextResponse.json({ 
      response: text,
      messageId: assistantMessage.id,
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        { error: error.message, maxSize: `${MAX_BODY_SIZE_MB}MB` },
        { status: 413 }
      );
    }

    if (error instanceof InvalidJsonError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const status = getErrorStatus(error);
    console.error('Gemini API error:', error);

    if (status && RETRIABLE_STATUS.has(status)) {
      const fallbackText =
        status === 503
          ? 'CortexAI is temporarily overloaded. Please try again in a moment.'
          : 'CortexAI is currently unavailable. Please try again shortly.';

      try {
        if (!chatId) {
          return NextResponse.json(
            { error: fallbackText },
            { status }
          );
        }

        const fallbackMessage = await prisma.message.create({
          data: {
            content: fallbackText,
            role: 'assistant',
            chatId,
          },
        });

        return NextResponse.json(
          {
            response: fallbackText,
            messageId: fallbackMessage.id,
            degraded: true,
          },
          { status: 200 }
        );
      } catch (dbError) {
        console.error('Failed to persist fallback message:', dbError);
        return NextResponse.json(
          { error: fallbackText },
          { status }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}