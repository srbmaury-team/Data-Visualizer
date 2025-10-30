import { YamlAnalysisService } from './src/services/yamlAnalysisService.js';

// Test data that was causing issues
const testYaml = {
  children: [
    {
      name: "dataTabeleHeader", // This should NOT trigger naming convention warning
      children: [
        {
          name: "utam-omnistudio-common/pageObjects/dataTable", // This should NOT be flagged as typo
          value: "utam"
        },
        {
          name: "utam-omnistudio-common/pageObjects/dataTableHeader", // This should NOT be flagged as typo
          value: "utam"
        }
      ]
    },
    {
      name: "real_typo_test",
      value: "this has a real typo: databse and proces" // These SHOULD be flagged
    }
  ]
};

const yamlText = `
children:
  - name: dataTabeleHeader
    children:
      - name: utam-omnistudio-common/pageObjects/dataTable
        value: utam
      - name: utam-omnistudio-common/pageObjects/dataTableHeader
        value: utam
  - name: real_typo_test
    value: "this has a real typo: databse and proces"
`;

console.log('Testing User-Friendly Analysis...\n');

const analysis = YamlAnalysisService.analyzeYaml(testYaml, yamlText);

console.log('🚨 WARNINGS:');
analysis.issues.warnings.forEach((warning, index) => {
  console.log(`${index + 1}. ${warning.type}: ${warning.message}`);
  if (warning.type === 'Spelling Errors' && warning.details) {
    warning.details.forEach(detail => {
      console.log(`   - "${detail.typo}" → "${detail.correction}" (${detail.confidence} confidence, ${detail.source})`);
    });
  }
});

console.log('\n📝 INFO:');
analysis.issues.info.forEach((info, index) => {
  console.log(`${index + 1}. ${info.type}: ${info.message}`);
});

console.log('\n✅ EXPECTED BEHAVIOR:');
console.log('- Should NOT flag "Objects" in paths as typos');
console.log('- Should NOT suggest naming convention changes');
console.log('- Should flag actual typos like "databse" and "proces"');
console.log('- Should be user-friendly and practical');