const fs = require('fs');

const tmpl = fs.readFileSync("template.html.in", encoding='utf8');

function gatherPosts() {
    const fnPattern = /^(\d){4}-(\d){2}-(\d){2}-/;

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

        const html_path = "posts/" + dirent.name.replace('.md', '.html');
        if (!fs.existsSync(html_path)) {
            return new Error(`${html_path} doesn't exist`);
        }

        const date = dirent.name.slice(0, "YYYY-MM-DD".length);
        const md = fs.readFileSync(`posts/${dirent.name}`, encoding='utf8');

        const firstLineOffset = md.indexOf('\n');
        const title = md.slice(0, firstLineOffset).replace(/^# /, '');

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
        html += `<h2><a href="${post.file}">${post.title}</a></h2>`
        html += `<p class="date">${post.date}</p>`
    });
    process.stdout.write("✔️\n");

    process.stdout.write("   saving...       ");
    const index = tmpl.replace('<!-- CONTENT -->', html);
    fs.writeFileSync("index.html", index);
    process.stdout.write("✔️\n");
}

posts = gatherPosts();
buildIndex(posts);
