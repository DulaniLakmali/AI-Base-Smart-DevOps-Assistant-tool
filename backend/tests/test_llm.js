import { LLMProvider } from "../src/agents/llmProvider.js";

async function testLLM() {
  console.log("\n🧪 Testing LLM Provider...\n");

  try {
    const result = await LLMProvider.complete({
      systemPrompt:
        "You are a DevOps assistant. Return valid JSON only.",

      userPrompt:
        'Return {"status":"success","message":"Groq API connection is working"}',

      jsonMode: true
    });

    console.log("====================================");
    console.log("✅ LLM TEST COMPLETED");
    console.log("Provider:", result.provider);
    console.log("Latency:", result.latencyMs, "ms");
    console.log("Response:", result.content);
    console.log("====================================");

  } catch (err) {
    console.error("❌ LLM TEST FAILED");
    console.error(err);
  }
}

testLLM();