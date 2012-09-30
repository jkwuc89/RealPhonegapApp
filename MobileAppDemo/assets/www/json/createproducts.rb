#!/usr/bin/env ruby

jsonFile = File.open("products.json", "w")
    
jsonFile.puts "{"
jsonFile.puts "    \"success\": true,"
jsonFile.puts "    \"total\": #{ARGV[0]},"
jsonFile.puts "    \"products\":"
jsonFile.puts "    ["

max = ARGV[0].to_i
for i in 1..max
    jsonFile.puts "    {"
    jsonFile.puts "        \"webId\": #{i},"
    jsonFile.puts "        \"productCode\": \"065117-#{i}\","
    jsonFile.puts "        \"description\": \"PRODUCT #{i}\","
    jsonFile.puts "        \"manufacturer\": \"CRW\","
    jsonFile.puts "        \"productType\": \"part\","
    jsonFile.puts "        \"commodityCode\": \"NONE\","
    jsonFile.puts "        \"productAssociations\": "
    jsonFile.puts "        ["
    jsonFile.puts "        ]"
    if i < max
        jsonFile.puts "    },"
    else
        jsonFile.puts "    }"
    end
end

jsonFile.puts "    ]"
jsonFile.puts "}"

jsonFile.close

