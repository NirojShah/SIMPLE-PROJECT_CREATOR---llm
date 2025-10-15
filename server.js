#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const ollama = require("ollama");

async function loadModules() {
  const chalkModule = await import("chalk");
  const inquirerModule = await import("inquirer");

  return {
    chalk: chalkModule.default,
    inquirer: inquirerModule.default,
  };
}

async function chatWithModel(prompt) {
  const response = await ollama.chat({
    model: "llama3",
    messages: [{ role: "user", content: prompt }],
  });
  return response.message.content;
}
