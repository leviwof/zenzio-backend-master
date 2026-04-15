sudo apt update
sudo apt install redis-server -y

# Enable and start redis server

sudo systemctl enable redis-server
sudo systemctl start redis-server

# status

sudo systemctl status redis-server

# config

/etc/redis/redis.conf
sudo nano /etc/redis/redis.conf

# Find the line containing:

requirepass foobared

| Setting                    | What it does                       | Example                   |
| -------------------------- | ---------------------------------- | ------------------------- |
| `bind 127.0.0.1`           | Restricts Redis to local access    | Keep this for security    |
| `protected-mode yes`       | Prevents unsafe remote connections | Keep enabled              |
| `requirepass yourpassword` | Adds password auth                 | `requirepass MyRedis@123` |

sudo systemctl restart redis-server

run redis-cli
run AUTH yourpassword
PING

# FIND USER

ACL LIST
ACL USERS
