# 3D Portfolio - Инструкция по запуску

## Быстрый старт

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd portfolio-3d
   ```

2. **Настройте окружение**
   ```bash
   cp .env.example .env
   # Отредактируйте .env при необходимости
   ```

3. **Запустите проект**
   ```bash
   docker-compose up --build
   ```

## Доступные сервисы

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001 (admin/admin123)

## Структура проекта

```
portfolio-3d/
├── frontend/     # React приложение
├── backend/      # Express API
├── minio/        # MinIO хранилище
├── backup/       # Бэкапы БД
└── docker-compose.yml
```

## Полезные команды

```bash
# Запустить в фоновом режиме
docker-compose up -d

# Остановить все сервисы
docker-compose down

# Пересобрать и запустить
docker-compose up --build

# Посмотреть логи
docker-compose logs -f [service_name]

# Войти в контейнер
docker-compose exec backend bash
docker-compose exec frontend bash
```

## Разработка

### Локальная разработка

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Админка

- **URL**: http://localhost:3000/admin
- **Login**: admin
- **Password**: admin123

## Troubleshooting

### Порты заняты
```bash
# Проверить занятые порты
lsof -i :3000,8080,9000,9001

# Изменить порты в docker-compose.yml
```

### Проблемы с MinIO
```bash
# Пересоздать MinIO
docker-compose down
rm -rf minio/data
docker-compose up minio
```

### Очистка всех данных
```bash
docker-compose down -v
docker system prune -a
```

## Следующие шаги

1. Создать Dockerfile для backend
2. Создать Dockerfile для frontend
3. Настроить API маршруты
4. Создать 3D компоненты