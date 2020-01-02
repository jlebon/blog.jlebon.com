.PHONY: all
all:
	node build.js

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
