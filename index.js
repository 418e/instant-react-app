#!/usr/bin/env node
const inquirer = require("inquirer");
const cmd = require("child_process");
const fs = require("fs");
const fse = require("fs-extra");

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split(".");
const major = semver[0];

if (major < 14) {
  console.error(
    "You are running Node " +
      currentNodeVersion +
      ".\n" +
      "Spawn React App requires Node 14 or higher. \n" +
      "Please update your version of Node."
  );
  process.exit(1);
}
const questions = [
  {
    type: "input",
    name: "appName",
    message: "What would you like to name your React application?",
    default: "my-react-app",
  },
  {
    type: "confirm",
    name: "isTypescript",
    message: "Would you like to use typescript?",
    default: "Y",
  },
  {
    type: "confirm",
    name: "isTailwind",
    message: "Would you like to use tailwind CSS?",
    default: "Y",
  },
  {
    type: "confirm",
    name: "appRouter",
    message: "Would you like to use react-router?",
    default: "Y",
  },
  {
    type: "list",
    name: "appDF",
    message: "Would you like to use data fetching libraries?",
    default: "no",
    choices: ["swr", "axios", "swr/axios", "no"],
  },
  // soon
  // {
  //   type: "list",
  //   name: "appSM",
  //   message: "Which state management library would you like to use?",
  //   default: "none",
  //   choices: ["Redux", "Mobx", "Zustand", "Tanstack-Query", "Recoil", "none"],
  // },
  //
];

function createJavascript(appName) {
  const sourceDir = __dirname + "/templates/javascript";
  const targetDir = `./${appName}`;

  return fse
    .copy(sourceDir, targetDir, {
      overwrite: true,
    })
    .catch((err) =>
      console.error(`Error creating Javascipt boilerplate: ${err}`)
    );
}

function createTypescript(appName) {
  const sourceDir = __dirname + "/templates/typescript";
  const targetDir = `./${appName}`;

  return fse
    .copy(sourceDir, targetDir, {
      overwrite: true,
    })
    .catch((err) =>
      console.error(`Error creating Typescript boilerplate: ${err}`)
    );
}
async function addTailwind(appName, isTypescript) {
  const sourceDir =
    __dirname +
    (isTypescript
      ? "/templates/tailwind/tailwind.config.ts"
      : "/templates/tailwind/tailwind.config.js");

  return Promise.all([
    fse.copy(sourceDir, `${appName}/tailwind.config.js`, { overwrite: true }),
    fse.copy(
      __dirname + "/templates/tailwind/global.css",
      `${appName}/src/global.css`,
      {
        overwrite: true,
      }
    ),
    fse.copy(
      __dirname + `/templates/tailwind/postcss.config.js`,
      `${appName}/postcss.config.js`,
      { overwrite: true }
    ),
  ]).catch((err) => console.error(`Error adding Tailwind: ${err}`));
}

function addRouter(appName, isTypescript) {
  const sourceDir =
    __dirname +
    (isTypescript
      ? "/templates/routers/react-router/index.jsx"
      : "/templates/routers/react-router/index.js");
  const targetDir = isTypescript
    ? `./${appName}/src/index.tsx`
    : `./${appName}/src/index.js`;

  return fse.copy(sourceDir, targetDir, {
    filter: (src) => {
      return (
        !src.includes("node_modules") && !src.endsWith("package-lock.json")
      );
    },
    overwrite: true,
  });
}
function install(appName, isTailwind, appRouter, appDF) {
  return new Promise((resolve, reject) => {
    console.log("installing dependencies...");
    try {
      cmd.execSync(
        `cd ${appName} && npm install ${
          isTailwind && "tailwindcss postcss autoprefixer postcss-loader"
        } ${appRouter && "react-router react-router-dom"} ${
          appDF === "swr" && "swr"
        } ${appDF === "axios" && "axios"} ${
          appDF === "swr/axios" && "swr axios"
        }`,
        {
          stdio: "inherit",
        }
      );
      resolve();
    } catch (error) {
      console.error("Error installing dependencies:", error);
      reject(error);
    }
  });
}
inquirer.prompt(questions).then(async (answers) => {
  const {
    appName,
    isTypescript,
    isTailwind,
    appDF,
    appRouter,
    //  appSM,
  } = answers;
  if (!fs.existsSync(appName)) {
    console.log(`\nCreating a new react application: ${appName}...`);
    cmd.execSync(`mkdir ${appName}`);
  } else {
    console.log(`Directory ${appName} already exists.`);
    return;
  }
  if (isTypescript) {
    console.log("Installing Typescript boilerplate...");
    await createTypescript(appName);
  } else {
    console.log("Installing Javascript boilerplate...");
    await createJavascript(appName);
  }
  if (isTailwind) {
    console.log("Adding Tailwind to the project...");
    await addTailwind(appName, isTypescript, appRouter);
  }
  if (appRouter) {
    console.log(`Adding react-router to the project ...`);
    await addRouter(appName, isTypescript);
  }
  await install(appName, isTailwind, appRouter, appDF).then(() => {
    console.log(
      `Successfully installed depedencies! \n\n cd ${appName} \n npm start \n\n Happy Coding!`
    );
  });
});