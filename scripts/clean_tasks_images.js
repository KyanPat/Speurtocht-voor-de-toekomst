const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'itemsData.js');
let code = fs.readFileSync(filePath, 'utf8');

// Update Autosleutels task 1
code = code.replace(
  `"scenario": "Je nadert een kruising en ziet dit opvallende rode bord met witte letters.",
        "question": "Welk verkeersbord zie je op de afbeelding?",`,
  `"scenario": "Je nadert een kruising in de auto en ziet een achthoekig rood verkeersbord met de witte letters STOP.",
        "question": "Wat voor verkeersbord is dit?",`
);

// Update Diploma task 2
code = code.replace(
  `"scenario": "Bekijk het majestueuze dier op de foto uit het dierenrijk.",
        "question": "Hoe heet dit dier op de foto?",`,
  `"scenario": "In de biologieles leer je over zoogdieren. Dit dier heeft manen, vier hoeven en galoppeert over het veld.",
        "question": "Hoe heet dit dier?",`
);

// Update Droomreis task 1
code = code.replace(
  `"scenario": "Bekijk dit wereldberoemde ijzeren bouwwerk op de foto.",`,
  `"scenario": "Je ziet een wereldberoemd 330 meter hoog ijzeren bouwwerk aan de rivier de Seine (de Eiffeltoren).",`
);

// Remove all imageUrl and imageSource lines
code = code.replace(/\n\s+"imageUrl":\s*"[^"]+",/g, '');
code = code.replace(/\n\s+"imageSource":\s*"[^"]+",/g, '');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Cleaned itemsData.js successfully!');

