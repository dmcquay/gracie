module.exports.Request = function(files, minified) {
	this.files = files;
	this.minified = Boolean(minified);
	this.fileDataList = [];
	this.fileDataMap = {};
};
