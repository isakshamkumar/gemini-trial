const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyBLEP8u2Sgf5oSNEUBWdYOwbWh_jpud0xo";
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

async function generateContent(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function runGeminiPro(title, units) {
  const system_prompt =
    "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter.";
  const user_prompt = `It is your job to create a course about ${title}. The user has requested to create chapters for each of the ${units}. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in YouTube. The expected JSON format for the output is as follows: {"title": "Chapter Title", "youtube_search_query": "YouTube Search Query"}. You can also provide other prerequisite topics or relavant topics in this format `;
  const prompt = `${system_prompt} ${user_prompt}`;

  const output = await generateContent(prompt);
  console.log(output);
  const trimmedOutput = output
    .replace(/^.+?Output from gemini pro model:/s, "")
    .replace(/"$/s, "");
  return JSON.parse(trimmedOutput);
}

app.post("/api/course/createChapters", async (req, res) => {
  try {
    const { title, units } = req.body;

    const chapters = await runGeminiPro(title, units);

    res.json({ chapters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
