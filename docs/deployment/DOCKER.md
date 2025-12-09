# Docker Quick Reference

This document provides quick reference for Docker commands used in the Educard project.

## 🚀 Getting Started

### First Time Setup
```bash
# Build and start containers
docker-compose up --build
```

### Daily Development
```bash
# Start containers (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 📦 Container Management

### Starting and Stopping
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d app
docker-compose up -d db

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Viewing Status and Logs
```bash
# Check container status
docker-compose ps

# View logs (all services)
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View logs for specific service
docker-compose logs app
docker-compose logs db

# View last 50 lines
docker-compose logs --tail=50 app
```

## 💻 Application Commands

### npm Commands Inside Container
```bash
# Install new dependency
docker-compose exec app npm install package-name

# Install dev dependency
docker-compose exec app npm install --save-dev package-name

# Run npm scripts
docker-compose exec app npm run dev
docker-compose exec app npm test

# List installed packages
docker-compose exec app npm list --depth=0
```

### Accessing Application Shell
```bash
# Access container shell
docker-compose exec app sh

# Run commands inside container
docker-compose exec app ls -la
docker-compose exec app cat package.json
```

## 🗄️ Database Commands

### Connecting to PostgreSQL
```bash
# Connect to database
docker-compose exec db psql -U educard -d educard_dev

# Check database health
docker-compose exec db pg_isready -U educard

# Run SQL command
docker-compose exec db psql -U educard -d educard_dev -c "SELECT version();"
```

### Common PostgreSQL Commands (once connected)
```sql
-- List databases
\l

-- Connect to database
\c educard_dev

-- List tables
\dt

-- Describe table
\d table_name

-- View table contents
SELECT * FROM table_name;

-- Exit psql
\q
```

### Database Backups
```bash
# Create backup
docker-compose exec db pg_dump -U educard educard_dev > backup.sql

# Restore backup
docker-compose exec -T db psql -U educard -d educard_dev < backup.sql
```

## 🔧 Development Workflow

### Making Code Changes
1. Edit files locally - changes are reflected immediately via volume mount
2. nodemon will auto-restart the server
3. Refresh browser to see changes

### Adding Dependencies
```bash
# Add new package
docker-compose exec app npm install express-validator

# Rebuild containers (if package.json changed)
docker-compose up --build
```

### Database Migrations (when implemented)
```bash
# Run migrations
docker-compose exec app npm run migrate

# Rollback migrations
docker-compose exec app npm run migrate:undo

# Create new migration
docker-compose exec app npx sequelize-cli migration:generate --name migration-name
```

## 🐛 Troubleshooting

### Container Won't Start
```bash
# View error logs
docker-compose logs app

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Database Connection Issues
```bash
# Check database is running
docker-compose ps

# Check database health
docker-compose exec db pg_isready -U educard

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process (macOS/Linux)
kill -9 $(lsof -ti:3000)

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Clean Slate (Reset Everything)
```bash
# Stop and remove everything
docker-compose down -v

# Remove all containers, networks, volumes
docker-compose down -v --remove-orphans

# Rebuild from scratch
docker-compose up --build
```

### Out of Disk Space
```bash
# Clean up Docker system
docker system prune

# Remove all unused containers, networks, images
docker system prune -a

# Remove unused volumes
docker volume prune
```

## 📊 Monitoring

### Resource Usage
```bash
# View resource stats
docker stats

# View stats for specific container
docker stats educard_app educard_db
```

### Container Information
```bash
# Inspect container
docker-compose exec app env

# View container processes
docker-compose top

# View container config
docker inspect educard_app
```

## 🔐 Production Commands (Phase 5)

### Building for Production
```bash
# Build production image
docker build -t educard:latest .

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks
```bash
# Check database health
docker-compose exec db pg_isready -U educard

# Check app is responding
curl http://localhost:3000
```

## 📝 Environment Variables

### Viewing Environment
```bash
# View all environment variables
docker-compose exec app env

# View specific variable
docker-compose exec app sh -c 'echo $DB_HOST'
```

### Changing Environment
Edit `docker-compose.yml` and restart:
```bash
docker-compose down
docker-compose up -d
```

## 🎯 Quick Commands Cheat Sheet

```bash
# Daily workflow
docker-compose up -d           # Start
docker-compose logs -f app     # Watch logs
docker-compose down            # Stop

# Install packages
docker-compose exec app npm install package-name

# Database access
docker-compose exec db psql -U educard -d educard_dev

# Rebuild after changes
docker-compose up --build

# Complete reset
docker-compose down -v && docker-compose up --build
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Hub](https://hub.docker.com/_/node)

---

*For project-specific information, see [README.md](../README.md)*
