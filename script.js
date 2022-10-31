let formStartDate = document.getElementById("form-startDate")
let formEndDate = document.getElementById("form-endDate")
let formRoomId = document.getElementById("form-roomId")
let formApiKey = document.getElementById("form-apiKey")
let formOutputGrouped = document.getElementById("form-output-grouped")
let formOutput5min = document.getElementById("form-output-5min")
let formSend = document.getElementById("form-send")
let downloadButton = document.getElementById("download")
let divInfo = document.getElementById("info")
let dayToCheck = undefined
let dataFormat = undefined
let roomId = ""
let apiKey = undefined
let startDate = undefined
let endDate = undefined
let results = undefined
let resultsArray = []
dataForCSV = []
formRoomId.value = roomId

function download_csv_file() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += 'date,occupancy\n';
    dataForCSV.forEach(function (rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}
const displayOccupancy = (startTime) => {
    let midnight = Math.floor(new Date(dayToCheck.start).getTime() / 1000)
    //console.log(midnight, "midnight")
    let timeToCheck = midnight;
    for (i = 0; i < 288; i++) {
        let currentOccupancy = 0;
        let toCheckYear = new Date(timeToCheck * 1000).getUTCFullYear();
        let toCheckMonth = new Date(timeToCheck * 1000).getUTCMonth() + 1;
        if (toCheckMonth < 10) toCheckMonth = "0" + toCheckMonth
        let toCheckDay = new Date(timeToCheck * 1000).getUTCDate();
        if (toCheckDay < 10) toCheckDay = "0" + toCheckDay
        let toCheckMinute = new Date(timeToCheck * 1000).getUTCMinutes();
        if (toCheckMinute < 10) toCheckMinute = "0" + toCheckMinute
        let toCheckHour = new Date(timeToCheck * 1000).getUTCHours();
        if (toCheckHour < 10) toCheckHour = "0" + toCheckHour
        //check occupancy
        resultsArray.forEach(element => {
            if (element.startTime < timeToCheck && element.endTime > timeToCheck) {
                currentOccupancy = element.occupancy
            }
        })
        //display occupancy
        //console.log(currentOccupancy);
        dataForCSV.push([`${toCheckYear}-${toCheckMonth}-${toCheckDay}T${toCheckHour}:${toCheckMinute}`, currentOccupancy]);
        //console.log(dataForCSV, "dataForCSV");
        //increment timeToCheck by 5 minutes
        timeToCheck += 300
    }
}
const getOccupancy = (item) => {
    //get date and time from response:  
    let occupancy = item.occupancy;
    let itemStartTime = Math.floor(new Date(item.startTime).getTime() / 1000);
    let itemEndTime = Math.floor(new Date(item.endTime).getTime() / 1000);
    resultsArray.push({
        "occupancy": occupancy, "startTime": itemStartTime, "endTime": itemEndTime
    })
}
const getOccupancyGrouped = (item) => {
    dataForCSV.push([`${item.startTime.slice(0, 4)}-${item.startTime.slice(5, 7)}-${item.startTime.slice(8, 10)}T${item.startTime.slice(11, 13)}:${item.startTime.slice(14, 16)} - ${item.endTime.slice(0, 4)}-${item.endTime.slice(5, 7)}-${item.endTime.slice(8, 10)}T${item.endTime.slice(11, 13)}:${item.endTime.slice(14, 16)}`, item.occupancy])
}

const addDataToTable = (response, startTime) => {
    //console.log(startTime)
    if (dataFormat === "5min") {
        // display data in 5 minute format
        results = [["time", "occupancy"]]
        let content = response.content
        content.forEach(getOccupancy)
        displayOccupancy(startTime)
        divInfo.innerText = `fetching data. ${dataForCSV.length} records found so far`
    } else if (dataFormat === "grouped") {
        //display data in grouped format
        let content = response.content
        content.forEach(getOccupancyGrouped)
        //console.log(dataForCSV)
        divInfo.innerText = `fetching data. ${dataForCSV.length} records found so far`
    }
}
const fetchSingleDay = () => {
    //translating dayToCheck.start from date objects to string
    let startYear = dayToCheck.start.getUTCFullYear()
    let startMonth = dayToCheck.start.getUTCMonth() + 1
    if (startMonth < 10) startMonth = "0" + startMonth
    let startDay = dayToCheck.start.getUTCDate()
    if (startDay < 10) startDay = "0" + startDay
    let startHour = dayToCheck.start.getUTCHours()
    if (startHour < 10) startHour = "0" + startHour
    let startMinute = dayToCheck.start.getUTCMinutes()
    if (startMinute < 10) startMinute = "0" + startMinute
    let startSecond = dayToCheck.start.getUTCSeconds()
    if (startSecond < 10) startSecond = "0" + startSecond
    let startTime = `${startYear}-${startMonth}-${startDay}T${startHour}:${startMinute}:${startSecond}.782Z`
    //translating dayToCheck.end from date objects to string
    let endYear = dayToCheck.end.getUTCFullYear()
    let endMonth = dayToCheck.end.getUTCMonth() + 1
    if (endMonth < 10) endMonth = "0" + endMonth
    let endDay = dayToCheck.end.getUTCDate()
    if (endDay < 10) endDay = "0" + endDay
    let endHour = dayToCheck.end.getUTCHours()
    if (endHour < 10) endHour = "0" + endHour
    let endMinute = dayToCheck.end.getUTCMinutes()
    if (endMinute < 10) endMinute = "0" + endMinute
    let endSecond = dayToCheck.end.getUTCSeconds()
    if (endSecond < 10) endSecond = "0" + endSecond
    let endTime = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}:${endSecond}.782Z`
    //url encoding start and end time
    let urlStartTime = encodeURI(startTime)
    let urlEndTime = encodeURI(endTime)
    //console.log(urlStartTime + " " + urlEndTime);
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': apiKey
        }
    };
    fetch(`https://apps.cloud.us.kontakt.io/v3/occupancy/rooms/history?size=4444&startTime=${urlStartTime}&endTime=${urlEndTime}&roomId=${roomId}`, options)
        .then(response => response.json())
        .then(response => addDataToTable(response, startTime))
        .then(() => {
            dayToCheck.start.setDate(dayToCheck.start.getDate() + 1);
            dayToCheck.end.setDate(dayToCheck.end.getDate() + 1);
            if (dayToCheck.start < endDate) {
                fetchSingleDay()
            } else {
                downloadButton.style.display = "block";
                divInfo.innerText = "data ready to download"
            }
        })
        .catch(err => console.log(err));

}
const fetchData = () => {
    if (formApiKey.value.length < 3) {
        divInfo.innerText = "apiKey can't be empty"
    } else if (formStartDate.value > formEndDate.value) {
        divInfo.innerText = " start date must be earlier than end date"
    } else if (formStartDate.value === "" || formEndDate.value === "") {
        divInfo.innerText = "select start and edd dates first"
    } else if (dataFormat === undefined) {
        divInfo.innerText = "select data format"
    } else {
        startDate = new Date(formStartDate.value)
        endDate = new Date(formEndDate.value)
        roomId = formRoomId.value
        apiKey = formApiKey.value
        //console.log("startDate = " + startDate)
        //console.log("endDate = " + endDate)
        //console.log("dataFormat = " + dataFormat)
        //console.log("roomId = " + roomId)
        //setting startTime and endTime for API CALL 
        dayToCheck = { start: new Date(startDate), end: new Date(startDate) }
        dayToCheck.end.setHours(dayToCheck.end.getHours() + 23)
        dayToCheck.end.setMinutes(dayToCheck.end.getMinutes() + 59)
        dayToCheck.end.setSeconds(dayToCheck.end.getSeconds() + 59)
        // startTime = dayToCheck.start
        // endTime = dayToCheck.end
        fetchSingleDay()
        formSend.style.display = "none"
    }
}
const setOutputGrouped = () => {
    dataFormat = "grouped"
    formOutputGrouped.classList.add("glow-button")
    formOutput5min.classList.remove("glow-button")
}
formOutputGrouped.addEventListener("click", setOutputGrouped)
const setOutput5min = () => {
    dataFormat = "5min"
    formOutput5min.classList.add("glow-button")
    formOutputGrouped.classList.remove("glow-button")
}
formOutput5min.addEventListener("click", setOutput5min)
formSend.addEventListener("click", fetchData)