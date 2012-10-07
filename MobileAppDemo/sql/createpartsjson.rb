#!/usr/bin/env ruby

jsonFile = File.open("parts.json", "w")
    
jsonFile.puts "{"
jsonFile.puts "    \"count\": #{ARGV[0]},"
jsonFile.puts "    \"parts\":"
jsonFile.puts "    ["

max = ARGV[0].to_i
for i in 1..max
    partNum = 10000 + i
    qty = i;
    price = i * 0.5
    jsonFile.puts "    {"
    jsonFile.puts "        \"partnum\": #{partNum},"
    jsonFile.puts "        \"name\": \"JSON Part #{i}\","
    jsonFile.puts "        \"description\": \"JSON Description #{i}\","
    jsonFile.puts "        \"quantity\": #{qty},"
    jsonFile.puts "        \"price\": #{price}"
    if i < max
        jsonFile.puts "    },"
    else
        jsonFile.puts "    }"
    end
end

jsonFile.puts "    ]"
jsonFile.puts "}"

jsonFile.close


