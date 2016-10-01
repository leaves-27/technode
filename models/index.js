var mongoose = require("mongose");
mongoose.connect("mongodb://localhost/technode");
exports.User = mongoose.model("User",require("./user"));