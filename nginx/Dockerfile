FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY sites/default.conf /etc/nginx/conf.d/default.conf
COPY localhost.crt /etc/ssl/certs/localhost.crt
COPY localhost.key /etc/ssl/private/localhost.key

