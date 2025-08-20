let students = [];
let chartInstance = null;
let currentSection = 0;

// โหลดข้อมูลจาก LocalStorage
window.onload = function () {
    const storedData = localStorage.getItem("students");
    if (storedData) {
        students = JSON.parse(storedData);
    }
    updateTable();
    updateChart();
    document.getElementById("chartType").addEventListener("change", updateChart);
    document.getElementById("section1").classList.add("active");
    window.addEventListener("wheel", handleWheel, {
        passive: false
    });
};

function saveToLocalStorage() {
    localStorage.setItem("students", JSON.stringify(students));
}

function addStudent() {
    const name = document.getElementById("name").value.trim();
    const score = parseInt(document.getElementById("score").value);

    if (!name || isNaN(score)) {
        alert("กรุณากรอกชื่อและคะแนนให้ครบ");
        return;
    }
    if (score < 0 || score > 100) {
        alert("คะแนนต้องอยู่ระหว่าง 0 - 100 เท่านั้น");
        return;
    }

    students.push({
        name,
        score
    });
    saveToLocalStorage();
    document.getElementById("name").value = "";
    document.getElementById("score").value = "";
    updateTable();
    updateChart();
}

function deleteStudent(index) {
    students.splice(index, 1);
    saveToLocalStorage();
    updateTable();
    updateChart();
}

function clearAll() {
    if (confirm("คุณต้องการลบข้อมูลทั้งหมดหรือไม่?")) {
        students = [];
        saveToLocalStorage();
        updateTable();
        updateChart();
    }
}

function updateTable() {
    students.sort((a, b) => b.score - a.score);
    const tbody = document.querySelector("#scoreTable tbody");
    tbody.innerHTML = "";
    students.forEach((student, index) => {
        const grade = getGrade(student.score);
        const row = `<tr>
            <td>${index + 1}</td>
            <td contenteditable="true" onblur="editStudent(${index}, 'name', this.innerText)">${student.name}</td>
            <td contenteditable="true" onblur="editStudent(${index}, 'score', this.innerText)">${student.score}</td>
            <td>${grade}</td>
            <td>
              <button onclick="editStudentPrompt(${index})">แก้ไข</button>
              <button onclick="deleteStudentWithConfirm(${index})">ลบ</button>
            </td>
          </tr>`;
        tbody.innerHTML += row;
    });
}

function deleteStudentWithConfirm(index) {
    const toast = document.getElementById("toast");
    toast.innerHTML = `
            ต้องการลบ <b>${students[index].name}</b> หรือไม่?
            <button onclick="confirmDelete(${index})">ใช่</button>
            <button onclick="hideToast()">ยกเลิก</button>
          `;
    toast.classList.add("show");
}

function confirmDelete(index) {
    students.splice(index, 1);
    saveToLocalStorage();
    updateTable();
    updateChart();
    hideToast();
}

function hideToast() {
    const toast = document.getElementById("toast");
    toast.classList.remove("show");
}

function editStudent(index, field, value) {
    if (field === 'score') {
        const score = parseInt(value);
        if (isNaN(score) || score < 0 || score > 100) {
            alert("คะแนนต้องเป็นตัวเลข 0-100");
            updateTable();
            return;
        }
        students[index][field] = score;
    } else {
        students[index][field] = value.trim();
    }
    saveToLocalStorage();
    updateChart();
}

function editStudentPrompt(index) {
    const name = prompt("แก้ไขชื่อ", students[index].name);
    if (name !== null) students[index].name = name.trim();
    const scoreStr = prompt("แก้ไขคะแนน", students[index].score);
    const score = parseInt(scoreStr);
    if (!isNaN(score) && score >= 0 && score <= 100) {
        students[index].score = score;
    } else if (scoreStr !== null) {
        alert("คะแนนต้องอยู่ระหว่าง 0-100");
    }
    saveToLocalStorage();
    updateTable();
    updateChart();
}

function getGrade(score) {
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
}

function updateChart() {
    const ctx = document.getElementById("gradeChart").getContext("2d");
    const chartType = document.getElementById("chartType").value;

    if (chartInstance) {
        chartInstance.destroy();
    }

    let labels, data, chartTitle, chartActualType;

    if (chartType === 'score_range') {
        const highScoreCount = students.filter(s => s.score >= 50 && s.score <= 100).length;
        const lowScoreCount = students.filter(s => s.score >= 0 && s.score < 50).length;

        labels = ["คะแนน 50 - 100", "คะแนน 0 - 49"];
        data = [highScoreCount, lowScoreCount];
        chartTitle = "การกระจายคะแนนตามช่วง";
        chartActualType = 'bar';
    } else if (chartType === 'grade_f') {
        const fCount = students.filter(s => getGrade(s.score) === 'F').length;

        labels = ["นักเรียนที่ได้เกรด F"];
        data = [fCount];
        chartTitle = "จำนวนนักเรียนที่ได้เกรด F";
        chartActualType = 'bar';
    } else {
        const gradeCount = {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            F: 0
        };
        students.forEach(s => {
            gradeCount[getGrade(s.score)]++;
        });

        labels = ["A", "B", "C", "D", "F"];
        data = Object.values(gradeCount);
        chartTitle = "การกระจายเกรด";
        chartActualType = chartType;
    }

    let yMax = 100;
    if (chartActualType === 'bar' || chartActualType === 'line') {
        const maxCount = Math.max(...data);
        if (maxCount > 100) {
            yMax = maxCount;
        }
    }

    chartInstance = new Chart(ctx, {
        type: chartActualType,
        data: {
            labels: labels,
            datasets: [{
                label: chartTitle,
                data: data,
                backgroundColor: chartActualType === "pie" ? ["#34d399", "#60a5fa", "#facc15", "#fb923c", "#ef4444"] : "#1a73e8",
                borderColor: chartActualType !== "pie" ? "#1a73e8" : undefined,
                fill: chartActualType === "line" ? false : undefined,
                tension: chartActualType === "line" ? 0.4 : undefined
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: chartActualType !== "pie" ? {
                y: {
                    beginAtZero: true,
                    max: yMax,
                    ticks: {
                        stepSize: 1
                    }
                }
            } : undefined,
            plugins: {
                legend: {
                    display: chartActualType === "pie"
                },
                title: {
                    display: true,
                    text: chartTitle
                }
            }
        }
    });
}

function importCSV() {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files.length) {
        alert("กรุณาเลือกไฟล์ CSV ก่อน");
        return;
    }

    const file = fileInput.files[0];
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            results.data.forEach(row => {
                if (row.name && row.score && !isNaN(row.score)) {
                    students.push({
                        name: row.name.trim(),
                        score: parseInt(row.score)
                    });
                }
            });
            saveToLocalStorage();
            updateTable();
            updateChart();
            alert("นำเข้าข้อมูลสำเร็จ ✅");
        }
    });
}

function exportCSV() {
    if (students.length === 0) {
        alert("ไม่มีข้อมูลให้นำออก");
        return;
    }
    const csv = Papa.unparse(students);
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function changeSection(index) {
    const sections = document.querySelectorAll("section");
    const dots = document.querySelectorAll(".nav-dot");
    sections[currentSection].classList.remove("active");
    dots[currentSection].classList.remove("active");
    currentSection = index;
    sections[currentSection].classList.add("active");
    dots[currentSection].classList.add("active");
}

function handleWheel(event) {
    event.preventDefault();
    const tableContainer = document.querySelector(".table-container");
    const isMouseOverTable = tableContainer.contains(event.target);
    const delta = event.deltaY;
    const sections = document.querySelectorAll("section");

    if (isMouseOverTable && currentSection === 0) {
        tableContainer.scrollTop += delta;
    } else {
        if (delta > 0 && currentSection < sections.length - 1) {
            changeSection(currentSection + 1);
        } else if (delta < 0 && currentSection > 0) {
            changeSection(currentSection - 1);
        }
    }
}