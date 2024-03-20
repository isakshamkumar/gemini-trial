const express = require("express");
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = "AIzaSyBLEP8u2Sgf5oSNEUBWdYOwbWh_jpud0xo";
const genAI = new GoogleGenerativeAI(apiKey);

app.use(express.json());

app.post("/", async (req, res) => {
  const { title, units } = req.body;
  const system_prompt =
    "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter.";
  const user_prompt = units.map(
    (unit) =>
      `Create a course about ${unit}. For each chapter, provide a detailed YouTube search query.`
  );

  const output_format = {
    course_title: title,
    units: units.map((unit) => ({
      unit_title: unit,
      chapters: [
        {
          youtube_search_query: "",
          chapter_title: "",
        },
      ],
    })),
  };

  let result = await strict_output(system_prompt, user_prompt, output_format);

  if (
    result &&
    result.response &&
    result.response.candidates &&
    result.response.candidates.length > 0
  ) {
    let respContent = result.response.candidates[0].content;
    if (respContent && respContent.parts && respContent.parts.length > 0) {
      let respText = respContent.parts[0].text;
      if (respText) {
        const cleanedData = respText.replace(/\n/g, "");
        const jsonData = JSON.parse(cleanedData);
        return res.status(200).json(jsonData);
      }
    }
  }

  if (result) {
    return res.json({ result });
  }

  return res.status(500).send("Error: Unable to process response");
});

app.listen(3005, () => {
  console.log("Server started");
});

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function strict_output(system_prompt, user_prompt, output_format) {
  let attempts = 0;
  let maxAttempts = 5; // Maximum number of attempts to get the correct structure
  let result;

  while (attempts < maxAttempts) {
    // Construct the prompts for the AI model
    const prompts = [
      {
        role: "system",
        content: system_prompt + output_format,
      },
      ...user_prompt.map((prompt) => ({
        role: "user",
        content: prompt.toString(),
      })),
    ];

    // Generate content using the AI model
    result = await model.generateContent({
      contents: prompts.map((prompt) => ({
        parts: prompt.content,
        role: prompt.role,
      })),
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // Check if the response matches the desired structure
    if (matchesDesiredStructure(result, output_format)) {
      break; // Exit the loop if the structure matches
    }

    attempts++;
  }

  return result;
}

function matchesDesiredStructure(response, desiredStructure) {
  // Helper function to check if a value is an object
  function isObject(value) {
    return value != null && typeof value === "object";
  }

  // Recursive function to perform deep equality check
  function deepEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = obj1[key];
      const val2 = obj2[key];
      const areObjects = isObject(val1) && isObject(val2);

      if (
        (areObjects && !deepEqual(val1, val2)) ||
        (!areObjects && val1 !== val2)
      ) {
        return false;
      }
    }

    return true;
  }

  // Assuming response is a JSON object parsed from the AI's output
  // and desiredStructure is the structure you expect the response to match
  return deepEqual(response, desiredStructure);
}

return true;
