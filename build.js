const fs = require('fs');
const showdown = require('showdown');
const hljs = require('highlight.js');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const tmpl = fs.readFileSync("template.html", encoding='utf8');

function buildPosts() {
    const fnPattern = /^(\d){4}-(\d){2}-(\d){2}-/;

    showdown.setOption('headerLevelStart', 2);

    var c = new showdown.Converter();
    var d = fs.opendirSync("posts");
    var posts = [];

    for (;;) {
        const dirent = d.readSync();
        if (dirent == null) {
           break;
        }

        if (!dirent.name.endsWith(".md") || !dirent.isFile()) {
           continue;
        }

        if (!fnPattern.test(dirent.name)) {
            return new Error(`${dirent.name} doesn't match YYYY-MM-DD-...`);
        }

        const date = dirent.name.slice(0, "YYYY-MM-DD".length);

        const md_path = `posts/${dirent.name}`;
        const html_path = md_path.replace('.md', '.html');
        process.stdout.write(`${md_path}\n`);

        process.stdout.write("   converting...   ");
        const md = fs.readFileSync(md_path, encoding='utf8');

        const firstLineOffset = md.indexOf('\n');
        const title = md.slice(0, firstLineOffset).replace(/^# /, '');
        const mdContent = md.slice(firstLineOffset+1);

        var html = c.makeHtml(mdContent);
        html = `<h2>${title}</h2><p class="date">${date}</p>` + html;
        var post = tmpl.replace('<!-- CONTENT -->', `<article>${html}</article>`);
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

        posts.push({
            file: html_path,
            title: title,
            date: date,
        });
    }

    return posts;
}

function buildIndex(posts) {
    process.stdout.write("index.html\n");

    process.stdout.write("   rendering...    ");
    var html = "";
    posts.sort(function(a, b) { a.date.localeCompare(b.date) });
    posts.forEach(function(post) {
        html += `<a href="${post.file}"><h2>${post.title}</h2></a>`
        html += `<p class="date">${post.date}</p>`
    });
    process.stdout.write("✔️\n");

    process.stdout.write("   saving...       ");
    const index = tmpl.replace('<!-- CONTENT -->', html);
    fs.writeFileSync("index.html", index);
    process.stdout.write("✔️\n");
}

posts = buildPosts();
buildIndex(posts);
