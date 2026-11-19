# Foundathyon Deploy - static HTML with nginx (unprivileged image)
# PORT TO SET IN THE PANEL: 8080
# Put your site in the "public/" folder of the build context (or edit the COPY line).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --chown=nginx:nginx public/ /usr/share/nginx/html/
# Listens on 0.0.0.0:8080 and runs as the "nginx" user.
EXPOSE 8080
