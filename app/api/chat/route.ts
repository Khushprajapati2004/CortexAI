export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Increase if needed
    },
  },
};
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('=== /api/chat POST endpoint called');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user.id);

    const { message, mode, chatId } = await request.json();

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const prompt = `${context}\n\nUser: ${message}\n\nProvide a helpful, professional response:`;

    console.log('Calling Gemini API');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}