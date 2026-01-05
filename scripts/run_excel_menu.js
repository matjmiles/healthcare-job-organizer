const { execSync } = require('child_process');
const readline = require('readline');

const menuOptions = [
  {
    label: '1. Convert Word documents to JSON (data/word/ → data/json/word/)',
    script: 'word_to_json.js',
    description: 'Converts Word document files (.docx) in data/word/ to JSON format in data/json/word/.'
  },
  {
    label: '2. Generate Excel from manual JSON only (data/json/manual)',
    script: 'json_to_excel_manual.js',
    description: 'Creates an Excel file from only the JSON files in data/json/manual (manual/HTML jobs).'
  },
  {
    label: '3. Generate Excel from webScrape JSON only (data/json/webScrape)',
    script: 'json_to_excel_webScrape.js',
    description: 'Creates an Excel file from only the JSON files in data/json/webScrape (web-scraped jobs).'
  },
  {
    label: '4. Generate Excel from ALL JSON files (combined processing)',
    script: 'json_to_excel_all.js',
    description: 'Creates an Excel file from all JSON files in manual, webScrape, and word directories.'
  },
  {
    label: '5. Generate Excel from ALL sources (pipeline + manual + word)',
    script: 'json_to_excel.js',
    description: 'Runs the main script combining pipeline JSON, manual JSON, and word JSON files.'
  },
  {
    label: '6. Exit',
    script: null,
    description: 'Exit the menu.'
  }
];

function printMenu() {
  console.log('\n=== Job Excel Generation Menu ===');
  menuOptions.forEach(opt => {
    console.log(opt.label);
    console.log('   - ' + opt.description);
  });
}

function runScript(script) {
  try {
    console.log(`\nRunning: node ${script}\n`);
    execSync(`node ${script}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Error running ${script}:`, err.message);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt() {
  printMenu();
  rl.question('\nSelect an option (1-6): ', answer => {
    const idx = parseInt(answer.trim(), 10) - 1;
    if (idx >= 0 && idx < menuOptions.length) {
      const opt = menuOptions[idx];
      if (opt.script) {
        runScript(opt.script);
        prompt();
      } else {
        console.log('Exiting.');
        rl.close();
      }
    } else {
      console.log('Invalid option. Please try again.');
      prompt();
    }
  });
}

prompt();
