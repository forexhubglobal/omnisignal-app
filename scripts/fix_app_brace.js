const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

const target = `    const guestBtn = $('#btnGuestLogin', overlay);
    if (guestBtn) {
      guestBtn.onclick = () => {
        doLogin('Guest Trader');
      };
    };
    }
  }`;

const replacement = `    const guestBtn = $('#btnGuestLogin', overlay);
    if (guestBtn) {
      guestBtn.onclick = () => {
        doLogin('Guest Trader');
      };
    }
  }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(appJsPath, code, 'utf8');
  console.log('Fixed extra brace in js/app.js successfully');
} else {
  console.log('Target not matched directly, using regex');
  code = code.replace(/guestBtn\.onclick\s*=\s*\(\)\s*=>\s*\{\s*doLogin\('Guest Trader'\);\s*\};\s*\};\s*\}\s*\}/m, "guestBtn.onclick = () => {\n        doLogin('Guest Trader');\n      };\n    }\n  }");
  fs.writeFileSync(appJsPath, code, 'utf8');
  console.log('Fixed via regex');
}
