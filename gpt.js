// Import the Gemini Pro model
const express = require("express");
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { json } = require("express/lib/response");
const apiKey = "AIzaSyBLEP8u2Sgf5oSNEUBWdYOwbWh_jpud0xo"; // Ensure you have set GOOGLE_API_KEY environment variable
const genAI = new GoogleGenerativeAI(apiKey);

app.use(express.json());
app.post("/", async (req, res) => {
  const { title, units, paid } = req.body;
  const system_prompt = `You are an AI capable of curating comprehensive course content. Given a course title and an array of unit titles, your task is to generate a detailed course structure. This includes creating relevant chapter titles and identifying YouTube videos for each chapter. The course should cover a wide range of topics related to the provided title, ensuring a comprehensive learning experience.

  For each unit, generate a detailed chapter structure. ${!paid? ' Generate a structure with 4-5 chapters per unit,focus on the core concepts and foundational knowledge. ':' ensure to include additional units or topics related to the provided title, with a structure that includes at least 8 chapters per unit. The goal is to create a course that starts from the basics and progresses to advanced topics, covering all aspects of the subject matter'} Each chapter should include a YouTube search query that leads to an informative educational video. The search query should be specific enough to find relevant educational content on YouTube.
  
  ${!paid ? "focus on the core concepts and foundational knowledge." : ` Ensure to include additional units or topics related to the provided title. These should be integrated into the course structure, following the same format as the initial units. The goal is to create a course that starts from the basics and progresses to advanced topics, covering all aspects of the subject matter.`}. Also Make sure that the title and order of units and chapter make sense and are related.
  
  The output should be a JSON object with the following structure:
  
  {
   "course_title": "A concise and descriptive course title that summarizes the course content",
   "Units": [
      {
        "unit_title": "A descriptive title for the unit",
        "chapters": [
          {
            "youtube_search_query": "A specific search query to find an educational video",
            "chapter_title": "A descriptive title for the chapter"
          },
          // Additional chapters...
        ]
      },
      // Additional units...
   ]
  }
  
  Ensure the output is well-structured and follows the specified format. Do not include quotation marks or escape characters in the output fields.`;
  
  const user_prompt = units.map(
    (unit) =>
      `It is your job to create a unit about ${unit}. The user has requested to create chapters for ${unit}. Then, for each chapter, provide a detailed YouTube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in YouTube.`
  );
  const output_format = {
    course_title: `make sure always include this ${title} or similar title according to you in output and if the title does not resonate with the units then make a course_title which resonates with unit_title and this is only the main title of the whole course summkarizing what all is in this course`,
    Units: [
      {
        unit_title: "this is the unit title for a particular unit",
        chapters: [
          {
            youtube_search_query:
              "this youtube search query would be provided by you",
            chapter_title: "this chapter_title would be provided by you",
          },
        ],
      },
    ],
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
        // Remove \n characters
        const cleanedData = respText.replace(/\n/g, "");
        // Parse the cleaned string into a JSON object
        const jsonData = JSON.parse(cleanedData);
        return res.status(200).json(jsonData);
      }
    }
  }
  if (result) {
    return res.json({ result });
  }

  // If any part of the response is missing or invalid
  return res.status(500).send("Error: Unable to process response");
});

app.listen(3005, () => {
  console.log("Server started");
});
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
async function strict_output(
  system_prompt,
  user_prompt,
  output_format,
  default_category = "",
  output_value_only = false,
  // model: string = "gpt-3.5-turbo",
  temperature = 1,
  num_tries = 3,
  paid = false,
  verbose = false
) {
  while (true) {
    const list_input = Array.isArray(user_prompt);
    // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
    const dynamic_elements = /<.*?>/.test(JSON.stringify(output_format));
    // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
    const list_output = /\[.*?\]/.test(JSON.stringify(output_format));

    // start off with no error message
    let error_msg = "";

    for (let i = 0; i < num_tries; i++) {
      let output_format_prompt = `\nYou are to output ${
        list_output && "an array of objects in"
      } the following in json format: ${JSON.stringify(
        output_format
      )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

      if (list_output) {
        output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
      }

      // if output_format contains dynamic elements, process it accordingly
      if (dynamic_elements) {
        output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
      }

      // if input is in a list format, ask it to generate json in a list
      if (list_input) {
        output_format_prompt += `\nGenerate an array of json, one json for each input element.`;
      }

      // Use OpenAI to get a response
      const result = await model.generateContent(
        JSON.stringify({
          messages: [
            {
              role: "system",
              content: system_prompt + output_format_prompt + error_msg,
            },
            { role: "user", content: user_prompt.toString() },
          ],
        })
      );

      // console.log(result,'resultttttt');

      if (
        result &&
        result.response &&
        result.response.candidates &&
        result.response.candidates.length > 0
      ) {
        let respContent = result.response.candidates[0].content;
        let respText = respContent.parts[0].text;
        const cleanedData = respText.replace(/\n/g, "");

        // Parse the cleaned string into a JSON object
        try {
          console.log(cleanedData,'cleaned Data');
          let output = JSON.parse(cleanedData);
          // Check if the number of units is less than 4 and paid is true
          // if (paid && output.result.Units && output.result.Units.length < 12) {
          //   // If condition not met, continue the loop to call the API again
          //   continue;
          // } else if (
          //   paid &&
          //   output.result.Units &&
          //   output.result.Units.length == 12
          // ) {
          //   return output;
          // }
          return output

          // Return the output if the condition is met
        } catch (error) {
          console.log(error);
        }
      }
      break;
    }
    console.log("hello");
    return null;
  }
  // if the user input is in a list, we also process the output as a list of json
}
