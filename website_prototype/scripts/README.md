In the first attempt to implement ol-load-geopackage we used copy-wasm to copy a fresh copy of the sql-wasm.wasm in public 
folder.
Since the maintainer of ol-load-geopackage add the possibility to use a CDN instead of load it from the server, 
and it's a better solution
for an international project. I no longer used it but since it's a really short script, using node so no
problem including OS, I keep it just in case cloudflare cnd servers are down.