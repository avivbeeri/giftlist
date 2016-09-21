A simple gift-list I designed for a friend's wedding.

Requires access to a Redis database.

Features:
 * No login required
 * Allow tracking of items where multiples are desired
 * Stores images in the Redis store, meaning no need for static storag

Currently, the administration system is accessible at http://<server>/admin

Because the system was designed for deployment to Heroku (circa January 2014) it references their environment variables for port settings and Redis.
