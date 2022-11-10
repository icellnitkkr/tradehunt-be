const mongoose = require("mongoose");
require("mongoose-type-url");

const newsSchema = new mongoose.Schema(
	{
		img: {
			type: mongoose.SchemaTypes.Url,
			required: true,
		},
		link: {
			type: mongoose.SchemaTypes.Url,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("News", newsSchema);
