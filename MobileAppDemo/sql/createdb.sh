echo "Erasing current database files"
if [ -d file__0 ]; then
    rm -r file__0
fi
if [ -e Databases.db ]; then
    rm Databases.db
fi
echo "Creating database files"
sqlite3 -echo Databases.db < CreateDatabasesDb.sql
mkdir file__0
sqlite3 -echo file__0/0000000000000001.db < CreateDatabase.sql
echo "Done"

