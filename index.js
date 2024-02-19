#!/usr/bin/env node
const inquirer = require("inquirer");
const cmd = require("child_process");
const fs = require("fs");
const fse = require("fs-extra");

const questions = [
  {
    type: "input",
    name: "appName",
    message: "What would you like to name your React application?",
    default: "my-react-app",
  },
  {
    type: "list",
    name: "appBuild",
    message: "Which build configuration would like to use?",
    default: "webpack",
    choices: ["webpack", "parcel", "vite"],
  },
  {
    type: "confirm",
    name: "isTypescript",
    message: "Would you like to use typescript?",
    default: "Y",
  },
  {
    type: "list",
    name: "appStylings",
    message: "Which styling library would you like to use?",
    default: "tailwind",
    choices: ["tailwind", "none"],
  },
  {
    type: "list",
    name: "appRouter",
    message: "Which routing library would like to use?",
    default: "react-router",
    choices: ["react-router", "none"],
  },
];
async function importTemplate(template, appName) {
  const sourceDir = __dirname + "/templates/" + template;
  const targetDir = `./${appName}`;

  return fse.copy(sourceDir, targetDir, {
    overwrite: true,
  });
}

function buildWebpack(isTypescript, appName) {
  if (isTypescript) {
    importTemplate("webpack/typescript", appName);
  } else {
    importTemplate("webpack/javascript", appName);
  }
}
function buildParcel(isTypescript, appName) {
  if (isTypescript) {
    importTemplate("parcel/typescript", appName);
  } else {
    importTemplate("parcel/javascript", appName);
  }
}
function buildVite(isTypescript, appName) {
  if (isTypescript) {
    importTemplate("vite/typescript", appName);
  } else {
    importTemplate("vite/javascript", appName);
  }
}

async function installBuild(appBuild, isTypescript, appName) {
  switch (appBuild) {
    case "webpack":
      buildWebpack(isTypescript, appName);
      break;
    case "parcel":
      buildParcel(isTypescript, appName);
      break;
    case "vite":
      buildVite(isTypescript, appName);
      break;
  }
}

async function installLib(templates, appName) {
  const promises = [];
  templates.map((template) => {
    promises.push(
      fse.copy(
        __dirname + "/templates/" + template.template,
        `${appName}/${template.target}`,
        { overwrite: true }
      )
    );
  });
  return Promise.all(promises);
}

function installTailwind(appBuild, appName) {
  installLib(
    [
      { template: "tailwind/tailwind.config.js", target: "tailwind.config.js" },
      {
        template: "tailwind/global.css",
        target: appBuild == "vite" ? "src/global.css" : "src/index.css",
      },
      { template: "tailwind/postcss.config.js", target: "postcss.config.js" },
    ],
    appName
  );
}

function installScss(appBuild, appName) {}
function installCssInJsx(appBuild, appName) {}

async function installStylings(appStylings, appBuild, appName) {
  switch (appStylings) {
    case "tailwind":
      installTailwind(appBuild, appName);
      break;
    case "scss":
      installScss(appBuild, appName);
      break;
    case "cssInJsx":
      installCssInJsx(appBuild, appName);
      break;
  }
}

function installReactRouter(appBuild, isTypescript, appName) {
  const template = `routers/react-router/webpack.${
    isTypescript ? "tsx" : "js"
  }`;
  switch (appBuild) {
    case "webpack":
      installLib(
        [
          {
            template,
            target: `src/index.${isTypescript ? "tsx" : "js"}`,
          },
        ],
        appName
      );
      break;
    case "parcel":
      installLib(
        [
          {
            template,
            target: `src/index.${isTypescript ? "tsx" : "jsx"}`,
          },
        ],
        appName
      );
      break;
    case "vite":
      installLib(
        [
          {
            template,
            target: `src/main.${isTypescript ? "tsx" : "jsx"}`,
          },
        ],
        appName
      );
      break;
  }
}
function installWouter(appBuild) {}
function installTSRouter(appBuild) {}

async function installRouters(appRouter, appBuild, isTypescript, appName) {
  switch (appRouter) {
    case "react-router":
      installReactRouter(appBuild, isTypescript, appName);
      break;
    case "wouter":
      installWouter(appBuild);
      break;
    case "tanstack-router":
      installTSRouter(appBuild);
      break;
  }
}

inquirer.prompt(questions).then(async (answers) => {
  const { appName, appBuild, isTypescript, appStylings, appRouter } = answers;
  if (!fs.existsSync(appName)) {
    cmd.execSync(`mkdir ${appName}`);
  } else {
    console.log(`Directory ${appName} already exists.`);
    return;
  }
  await installBuild(appBuild, isTypescript, appName);
  await installStylings(appStylings, appBuild, appName);
  await installRouters(appRouter, appBuild, isTypescript, appName);
  cmd.execSync(
    `npm install --prefix ${appName} ${
      appStylings === "tailwind"
        ? "tailwindcss postcss autoprefixer postcss-loader"
        : ""
    } ${appRouter === "react-router" ? "react-router react-router-dom" : ""}`,
    {
      stdio: "inherit",
    }
  );
});
