// After mongos starts, connect to it and run:

sh.addShard("shardNP_WEST/shardNP_WEST:27017");
sh.addShard("shardNP_MID/shardNP_MID:27017");
sh.addShard("shardNP_EAST/shardNP_EAST:27017");

sh.addShardTag("shardNP_EAST", "NP_EAST");
sh.addShardTag("shardNP_WEST", "NP_WEST");
sh.addShardTag("shardNP_MID", "NP_MID");

sh.enableSharding("banking_db");

sh.shardCollection("banking_db.transactions", { bank_region: 1, transactionId: 1 });

sh.updateZoneKeyRange("banking_db.transactions", { bank_region: "NP_EAST" }, { bank_region: "NP_EAST~" }, "NP_EAST");
sh.updateZoneKeyRange("banking_db.transactions", { bank_region: "NP_WEST" }, { bank_region: "NP_WEST~" }, "NP_WEST");
sh.updateZoneKeyRange("banking_db.transactions", { bank_region: "NP_MID" }, { bank_region: "NP_MID~" }, "NP_MID");
