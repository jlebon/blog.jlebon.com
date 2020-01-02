posts_md := $(shell find posts -type f -name '*.md')
posts_html := $(patsubst posts/%.md,posts/%.html,${posts_md})

.PHONY: all
all: index.html

index.html: ${posts_html} template.html.in build_index.js
	node build_index.js

posts/%.html: posts/%.md template.html.in build_post.js
	node build_post.js $<

.PHONY: clean
clean:
	rm -f posts/*.html index.html

# This is a hacky way to get multi-line strings in a Makefile so we can feed it
# to xargs for better parallel processing than backgrounding and maybe leaking.
define SERVE
"while true; do inotifywait -qqre modify . --exclude '.git' --exclude 'tags.*'; make || :; done"
"python3 -m http.server 8888"
endef
export SERVE

.PHONY: serve
serve:
	xargs -n 1 -P 2 sh -c <<< "$$SERVE"

.PHONY: publish
publish:
	aws s3 sync --delete --exclude '*' --include 'css/*.css' --include 'index.html' --include 'assets/*' --include 'error.html' --include 'posts/*.html' . s3://blog.jlebon.com
	aws cloudfront create-invalidation --distribution-id=E1N33MTTDP2DMG --paths /
