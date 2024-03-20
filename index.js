const express = require("express");

const { ZodError } = require("zod");

// Import the Gemini Pro model
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable or provide it directly
const apiKey = "AIzaSyBLEP8u2Sgf5oSNEUBWdYOwbWh_jpud0xo"; // Ensure you have set GOOGLE_API_KEY environment variable
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Define a function to generate content using the Gemini Pro model
async function generateContent(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // console.log("tokens", totalTokens);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Define the runGeminiPro function
async function runGeminiPro(title, units) {
  const system_prompt =
    "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter";
  const user_prompt =
  new Array(units.length).fill(
    `It is your job to create a course about ${title}. The user has requested to create chapters for each of the units. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in youtube.`
  )
  const output_format = {
    title: title,
    chapters:
      "an array of chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object",
  };

  const prompt =
    system_prompt + user_prompt + "the json format is " + user_prompt;
  const output = await generateContent(prompt);
  // const { totalTokens } = await model.countTokens(output);
  // console.log("token", totalTokens);
  console.log(output);
  JSON.stringify(output);
  console.log(output,'after stringify');
  return JSON.parse(output);
}

// Define the POST endpoint to generate chapters
app.post("/api/course/createChapters", async (req, res) => {
  try {
    const { title, units } = req.body;

    // Run the Gemini Pro model to generate chapters
    const chapters = await runGeminiPro(title, units);

    // Return the generated chapters
    res.json({ chapters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
