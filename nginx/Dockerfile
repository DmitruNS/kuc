FROM nginx:alpine

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Копируем фронтенд
COPY frontend/build /usr/share/nginx/html/

# Создаем директорию для загрузок с правильным пользователем nginx
RUN mkdir -p /app/uploads && \
    chown -R nginx:nginx /app/uploads && \
    chmod 755 /app/uploads

EXPOSE 80 443
