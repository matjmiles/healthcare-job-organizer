const { execSync } = require('child_process');
const readline = require('readline');

const menuOptions = [
  {
    label: '1. Generate Excel from manual JSON only (data/json/manual)',
    script: 'json_to_excel_manual.js',
    description: 'Creates an Excel file from only the JSON files in data/json/manual (manual/HTML jobs).'
  },
  {
    label: '2. Generate Excel from webScrape JSON only (data/json/webScrape)',
    script: 'json_to_excel_webScrape.js',
    description: 'Creates an Excel file from only the JSON files in data/json/webScrape (web-scraped jobs).'
  },
  {
    label: '3. Generate Excel from ALL JSON files (manual + webScrape)',
    script: 'json_to_excel_all.js',
    description: 'Creates an Excel file from all JSON files in both data/json/manual and data/json/webScrape.'
  },
  {
    label: '4. Generate Excel using legacy script (all sources)',
    script: 'json_to_excel.js',
    description: 'Runs the original script, combining pipeline, manual, and legacy JSON files.'
  },
  {
    label: '5. Exit',
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
  rl.question('\nSelect an option (1-5): ', answer => {
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
