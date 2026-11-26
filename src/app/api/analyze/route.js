import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetch website content safely
    let textContent = '';
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      textContent = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 12000);
    } catch (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch the target website URL. Ensure it is publicly accessible.' }, { status: 400 });
    }

    // 2. Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

    // Structured prompt requesting clear markdown headings
    const prompt = `You are an expert digital marketing strategist. Analyze the website content below (${url}) and provide structured, actionable marketing strategies. 

You MUST use these exact markdown headers for the sections:
## 🎯 Target Audience Breakdown
## 🔍 SEO Recommendations & Keywords
## 📱 Social Media & Content Marketing Plan
Website Content:
${textContent}`;

    const geminiResponse = await model.generateContent(prompt);
    const analysisResult = geminiResponse.response.text();

    // 3. Save to MongoDB
    const client = await clientPromise;
    const db = client.db("marketing_os"); 
    const collection = db.collection('analyses');

    const document = {
      url,
      analysis: analysisResult,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(document);

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('analyses');

    const analyses = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ success: true, analyses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}