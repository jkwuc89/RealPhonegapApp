#!/usr/bin/env ruby

DB_FILE = "file__0/0000000000000001.db"
DROP_PARTS_TABLE = "drop table parts"
CREATE_PARTS_TABLE = "create table parts (partnum primary key, name, description, quantity, price)"
INSERT_INTO_PARTS = "insert into parts values ("
SQLITE_CMD = "sqlite3 #{DB_FILE} "

puts "Dropping parts table"
system( "#{SQLITE_CMD} '#{DROP_PARTS_TABLE}'" )
puts "Creating parts table"
system( "#{SQLITE_CMD} '#{CREATE_PARTS_TABLE}'" )

max = ARGV[0].to_i
puts "Inserting #{max} rows into parts table"
for i in 1..max
    qty = i * 2
    price = i * 0.1
    insertSql = "#{INSERT_INTO_PARTS} #{i}, 'Part Name #{i}', 'Part Description #{i}', #{qty}, #{price})"
    system( "#{SQLITE_CMD} \"#{insertSql}\"" )
end

puts "Done"


