const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const hljs = require('highlight.js');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const tmpl = fs.readFileSync("template.html.in", encoding='utf8');

function buildPost(md_path) {
    const fnPattern = /^(\d){4}-(\d){2}-(\d){2}-/;

    showdown.setOption('headerLevelStart', 2);

    var c = new showdown.Converter();
    var posts = [];

    const basename = path.basename(md_path);
    if (!fnPattern.test(basename)) {
        return new Error(`${md_path} doesn't match YYYY-MM-DD-...`);
    }

    const date = basename.slice(0, "YYYY-MM-DD".length);
    const html_path = md_path.replace('.md', '.html');

    process.stdout.write(`${md_path}\n`);
    process.stdout.write("   converting...   ");
    const md = fs.readFileSync(md_path, encoding='utf8');

    const firstLineOffset = md.indexOf('\n');
    const title = md.slice(0, firstLineOffset).replace(/^# /, '');
    const mdContent = md.slice(firstLineOffset+1);

    var html = c.makeHtml(mdContent);
    html = `<h2>${title}</h2>\n<p class="date">${date}</p>\n` + html;
    var post = tmpl.replace('<!-- CONTENT -->', `<article>\n${html}\n</article>`);
    process.stdout.write("✔️\n");

    process.stdout.write("   highlighting... ");
    const dom = new JSDOM(post);
    const document = dom.window.document;
    const blocks = document.querySelectorAll('pre code');
    blocks.forEach(hljs.highlightBlock);
    const highlightedPost = dom.serialize();
    process.stdout.write("✔️\n");

    process.stdout.write("   saving...       ");
    fs.writeFileSync(html_path, highlightedPost);
    process.stdout.write("✔️\n");
}

process.argv.forEach(arg => { buildPost(arg) });
