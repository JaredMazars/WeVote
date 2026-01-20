const markdownpdf = require("markdown-pdf");
const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "COMPREHENSIVE_AUDIT_REPORT.md");
const outputFile = path.join(__dirname, "COMPREHENSIVE_AUDIT_REPORT.pdf");

const options = {
  paperFormat: "A4",
  paperOrientation: "portrait",
  paperBorder: "2cm",
  cssPath: path.join(__dirname, "audit-report-style.css"),
  remarkable: {
    html: true,
    breaks: true,
    plugins: [],
    syntax: ['footnote', 'sup', 'sub']
  }
};

console.log("📄 Generating PDF from audit report...");
console.log("Input:", inputFile);
console.log("Output:", outputFile);

markdownpdf(options)
  .from(inputFile)
  .to(outputFile, function () {
    console.log("\n✅ PDF generated successfully!");
    console.log("📁 Location:", outputFile);
    console.log("\n📊 File size:", (fs.statSync(outputFile).size / 1024).toFixed(2), "KB");
  });
