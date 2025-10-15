#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import ollama from "ollama";
import chalkModule from "chalk";

const chalk = chalkModule;

async function chatWithModel(prompt) {
  const response = await ollama.chat({
    model: "deepseek-r1:7b",
    messages: [{ role: "user", content: prompt }],
  });
  return response.message.content;
}

async function askProjectIdea() {
  const { idea } = await inquirer.prompt([
    {
      type: "input",
      name: "idea",
      message: chalk.cyan("What project do you want to build?"),
    },
  ]);
  return idea;
}

async function clarifyIdea(idea) {
  console.log(chalk.yellow("\n🤖 Let’s clarify your project idea...\n"));

  let finalIdea = idea;
  let clarified = false;

  while (!clarified) {
    const aiResponse = await chatWithModel(
      `The user wants to create: "${finalIdea}". 
Ask up to 3 clarifying questions to understand the project requirements better.
Then summarize the clarified project idea in the end.`
    );

    console.log(chalk.greenBright(aiResponse));

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: chalk.magenta("Are you satisfied with this project idea summary?"),
        default: true,
      },
    ]);

    if (confirm) clarified = true;
    else {
      const { newIdea } = await inquirer.prompt([
        {
          type: "input",
          name: "newIdea",
          message: chalk.cyan("Please refine or modify your project idea:"),
        },
      ]);
      finalIdea = newIdea;
    }
  }

  return finalIdea;
}

async function getDirectoryDetails() {
  const { dirPath, folderName } = await inquirer.prompt([
    {
      type: "input",
      name: "dirPath",
      message: chalk.green("Enter the directory path where you want to create the project:"),
      default: process.cwd(),
    },
    {
      type: "input",
      name: "folderName",
      message: chalk.green("Enter the project folder name:"),
    },
  ]);

  const projectPath = path.join(dirPath, folderName);
  await fs.ensureDir(projectPath);
  console.log(chalk.blue(`📁 Created folder at: ${projectPath}`));

  return projectPath;
}

async function createProject(projectPath, idea) {
  const packageJson = {
    name: path.basename(projectPath),
    version: "1.0.0",
    description: idea,
    main: "index.js",
    scripts: {
      start: "node index.js",
    },
  };

  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  await fs.writeFile(
    path.join(projectPath, "index.js"),
    `console.log("Welcome to your new project: ${idea}");`
  );

  await fs.writeFile(
    path.join(projectPath, "README.md"),
    `# ${path.basename(projectPath)}\n\n${idea}\n`
  );

  console.log(chalk.green(`\n✅ Project created successfully at ${projectPath}`));
}

async function main() {
  console.log(chalk.magenta.bold("\n🚀 Welcome to the LLM Project Creator!\n"));

  const idea = await askProjectIdea();
  const clarifiedIdea = await clarifyIdea(idea);
  const projectPath = await getDirectoryDetails();
  await createProject(projectPath, clarifiedIdea);

  console.log(chalk.cyan("\n🎉 All done! You can now:"));
  console.log(chalk.yellow(`cd ${projectPath}`));
  console.log(chalk.yellow(`npm install`));
  console.log(chalk.yellow(`npm start\n`));
}

main().catch((err) => {
  console.error(chalk.red("❌ Error:"), err);
});
