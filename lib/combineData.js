function getRatingStatistics(rawRatings){
    var mainStruct = [];
    for (var i = 0; i < 5; i++)
        mainStruct[i] = 0;
 
    var total = 0;
    for (var i = 0; i < rawRatings.length; i++){
        var rating = rawRatings[i];
        mainStruct[rating.rating - 1]++;
        total += rating.rating;
    }
    var avg = Math.round(total * 100 / rawRatings.length) / 100;

    var avgString = avg.toString();
    switch (avgString.length){
        case 1:
            avgString = avgString + ".00";
            break;
        case 3:
            avgString = avgString + "0";
            break;
    }

    return {
            "plotData": [
                {
                    "itemLabel": "1 star",
                    "itemValue": mainStruct[0]
                },
                {
                    "itemLabel": "2 star",
                    "itemValue": mainStruct[1]
                },
                {
                    "itemLabel": "3 star",
                    "itemValue": mainStruct[2]
                },
                {
                    "itemLabel": "4 star",
                    "itemValue": mainStruct[3]
                },
                {
                    "itemLabel": "5 star",
                    "itemValue": mainStruct[4]
                }
            ],
            "plotCenterText": avgString
        }
}

module.exports = {
    getRatingStatistics : getRatingStatistics
}
