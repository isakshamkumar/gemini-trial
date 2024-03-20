// Import the function for testing
const { runGeminiPro } = require("./index.js");

// Define sample prompts and output format for testing
const system_prompt =
  "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter";
const user_prompt =
  "It is your job to create a course about calculas. The user has requested to create chapters for each of the units. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educationalvideo for each chapter. Each query should give an educational informative course in youtube.";
const output_format = {
  title: "title of the unit",
  chapters:
    "an array of chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object",
};

// Function to run the test
async function testGeminiPro() {
  try {
    const output = await runGeminiPro(
      system_prompt,
      user_prompt,
      output_format
    );
    console.log("Output from Gemini Pro model:");
    console.log(output);
  } catch (error) {
    console.error("Error occurred during testing:", error);
  }
}

// Run the test
testGeminiPro();
