/* ============================================================
   DiabeteScan — script.js (FIXED VERSION)
============================================================ */


/* ── 1. UTILITY HELPERS ── */

function slUpd(el, outId, dec) {
  document.getElementById(outId).textContent = parseFloat(el.value).toFixed(dec);
}

function setTog(grpId, fieldId, val, btn) {
  document.querySelectorAll('#' + grpId + ' .tog')
          .forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById(fieldId).value = val;
  liveUpdate();
}

function scrollToForm() {
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function scrollToFeatures() {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

function getColorCls(field, val) {
  if (field === 'glucose') return val > 140 ? 'bad' : val > 110 ? 'warn' : 'good';
  if (field === 'bmi')     return val > 30  ? 'bad' : val > 25  ? 'warn' : 'good';
  if (field === 'bp')      return val > 90  ? 'bad' : val > 80  ? 'warn' : 'good';
  return val > 55 ? 'warn' : 'good';
}


/* ── 2. SCORE CALCULATION ── */

function calcScore() {
  const glucose     = parseFloat(document.getElementById('glucose').value)     || 0;
  const bmi         = parseFloat(document.getElementById('bmi').value)         || 25;
  const dpf         = parseFloat(document.getElementById('dpf').value)         || 0.5;
  const age         = parseFloat(document.getElementById('age').value)         || 0;
  const insulin     = parseFloat(document.getElementById('insulin').value)     || 0;
  const pregnancies = parseFloat(document.getElementById('pregnancies').value) || 0;
  const family      = document.getElementById('family').value    || 'None';
  const lifestyle   = document.getElementById('lifestyle').value || '';

  let score = 0;

  if (glucose > 0) score += Math.min(glucose / 200, 1) * 30;
  score += Math.min((bmi - 10) / 50, 1) * 20;
  score += dpf * 12;
  if (age > 0) score += Math.min(age / 80, 1) * 15;
  if (insulin > 0) score += Math.min(insulin / 300, 1) * 8;
  if (pregnancies > 0) score += Math.min(pregnancies / 10, 1) * 5;

  if (family === 'Parent' || family === 'Sibling') score += 5;
  if (family === 'Both') score += 10;

  if (lifestyle === 'Sedentary') score += 8;
  if (lifestyle === 'Lightly Active') score += 4;

  return Math.min(Math.round(score), 99);
}


/* ── 3. GAUGE ── */

function setGauge(arcId, needleId, pivotId, pctId, sublabelId, score, color, animated) {
  const TOTAL_ARC_LEN = 345;
  const targetDashOffset = TOTAL_ARC_LEN - (score / 100) * TOTAL_ARC_LEN;

  const angleDeg = -180 + (score / 100) * 180;
  const angleRad = angleDeg * (Math.PI / 180);
  const cx = 130, cy = 140, needleLen = 95;

  const needleX = cx + needleLen * Math.cos(angleRad);
  const needleY = cy + needleLen * Math.sin(angleRad);

  const arc = document.getElementById(arcId);
  const needle = document.getElementById(needleId);
  const pivot = document.getElementById(pivotId);
  const pctEl = document.getElementById(pctId);

  if (animated) {
    arc.style.transition = 'stroke-dashoffset .6s ease';
    needle.style.transition = 'x2 .6s ease, y2 .6s ease';
  }

  arc.setAttribute('stroke-dashoffset', targetDashOffset);
  needle.setAttribute('x2', needleX);
  needle.setAttribute('y2', needleY);
  pivot.setAttribute('fill', color);
  needle.setAttribute('stroke', color);
  pctEl.setAttribute('fill', color);
  pctEl.textContent = score + '%';

  if (sublabelId) {
    document.getElementById(sublabelId).textContent = 'Risk Score';
  }
}


/* ── 4. LIVE UPDATE ── */

function liveUpdate() {

  // 🔹 REAL INPUT VALUES
  let glucose = parseFloat(document.getElementById('glucose').value);
  let bp      = parseFloat(document.getElementById('bp').value);
  let bmi     = parseFloat(document.getElementById('bmi').value);
  let age     = parseFloat(document.getElementById('age').value);

  // 🔹 Agar empty hai tabhi default
  const hasInput = (
    document.getElementById('glucose').value ||
    document.getElementById('bp').value ||
    document.getElementById('age').value
  );

  if (!hasInput) {
    glucose = 100;
    bp = 80;
    bmi = 25;
    age = 30;
  }

  const score = calcScore();

  const color = score < 35 ? '#1D9E75'
               : score < 65 ? '#BA7517'
               : '#D85A30';

  setGauge(
    'hero-arc',
    'hero-needle',
    'hero-pivot',
    'hero-pct',
    'hero-sublabel',
    score,
    color,
    true
  );

  // 🔥 MINI METRICS UPDATE (IMPORTANT FIX)
  document.getElementById('mm-glucose').textContent =
    glucose ? glucose + " mg/dL" : "—";

  document.getElementById('mm-bp').textContent =
    bp ? bp + " mmHg" : "—";

  document.getElementById('mm-bmi').textContent =
    bmi ? bmi.toFixed(1) : "—";

  document.getElementById('mm-age').textContent =
    age ? age + " yrs" : "—";
}


/* ── 5. RUN PREDICTION (FIXED) ── */

function runPrediction() {

  const glucose = document.getElementById('glucose').value;
  const bp = document.getElementById('bp').value;
  const age = document.getElementById('age').value;

  if (!glucose || !bp || !age) {
    alert("Fill all fields 😤");
    return;
  }

  // 🔥 SHOW LOADING
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result-section').classList.remove('show');

  setTimeout(() => {

    const score = calcScore();

    let label = score < 35 ? "Low Risk"
      : score < 65 ? "Moderate Risk"
      : "High Risk";

    document.getElementById('r-badge').textContent = label;
    document.getElementById('result-section').classList.add('show');
    const glucoseVal = parseFloat(glucose);
    const bpVal = parseFloat(bp);
    const bmi = parseFloat(document.getElementById('bmi').value);
    const ageVal = parseFloat(age);

    // 🎯 Gauge update
    const color = score < 35 ? '#1D9E75'
                : score < 65 ? '#BA7517'
                : '#D85A30';

    setGauge(
      'res-arc',
      'res-needle',
      'res-pivot',
      'res-pct',
      null,
      score,
      color,
      true
    );

    // 🎯 Metrics update
    // 🎯 Metrics update (PROGRESS BAR UI)

    const metrics = [
      {
        label: 'Glucose',
        value: glucoseVal,
        normal: 100,
        max: 200
      },
      {
        label: 'BMI',
        value: bmi,
        normal: 25,
        max: 50
      },
      {
        label: 'Blood Pressure',
        value: bpVal,
        normal: 80,
        max: 150
      },
      {
        label: 'Age',
        value: ageVal,
        normal: 30,
        max: 80
      }
    ];

    document.getElementById('r-kn').innerHTML = metrics.map(m => {

      const percent = Math.min((m.value / m.max) * 100, 100);

      let color = '#1D9E75'; // green
      if (m.value > m.normal * 1.2) color = '#D85A30'; // red
      else if (m.value > m.normal) color = '#BA7517'; // yellow

      return `
        <div class="kn-item">
          <div style="font-weight:600">${m.label}: ${m.value}</div>

          <div style="background:#eee; border-radius:10px; height:8px; margin:6px 0;">
            <div style="
              width:${percent}%;
              background:${color};
              height:100%;
              border-radius:10px;">
            </div>
          </div>

          <div style="font-size:11px;color:#666">
            Normal: ${m.normal}
          </div>
        </div>
      `;
    }).join('');
    // 🔥 Smart Recommendations

    const recs = [];

    if (glucoseVal > 110)
      recs.push("Reduce sugar intake 🍬");

    if (bmi > 25)
      recs.push("Exercise regularly 🏃");

    if (bpVal > 85)
      recs.push("Control blood pressure 🫀");

    if (ageVal > 40)
      recs.push("Regular health checkups 🩺");

    if (recs.length === 0)
      recs.push("Your health looks good 👍 Maintain your lifestyle");

    document.getElementById('r-recs').innerHTML = recs.map(r => `
      <div style="
        background:#f5f5f5;
        padding:10px;
        border-radius:8px;
        margin:6px 0;
      ">
        ✔ ${r}
      </div>
    `).join('');
    // 🔥 Chart (Graph)

    const ctx = document.getElementById('riskChart').getContext('2d');

    if (window.myChart) {
      window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Glucose', 'BMI', 'BP', 'Age'],
        datasets: [{
          label: 'Your Values',
          data: [glucoseVal, bmi, bpVal, ageVal],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    document.getElementById('loading').style.display = 'none';

  }, 1500); // delay = AI feel
}


/* ── 6. RESET ── */

function resetForm() {

  // 🔹 Inputs reset
  document.getElementById('age').value = '';
  document.getElementById('glucose').value = '';
  document.getElementById('bp').value = '';
  document.getElementById('insulin').value = '';
  document.getElementById('pregnancies').value = '';

  // sliders reset
  document.getElementById('bmi').value = 25;
  document.getElementById('bmi-out').textContent = "25.0";

  document.getElementById('dpf').value = 0.5;
  document.getElementById('dpf-out').textContent = "0.50";

  // toggles reset
  document.querySelectorAll('.tog').forEach(btn => btn.classList.remove('on'));

  document.getElementById('gender').value = '';
  document.getElementById('family').value = '';
  document.getElementById('lifestyle').value = '';

  // 🔹 RESULT HIDE
  document.getElementById('result-section').classList.remove('show');

  // 🔥 🔥 IMPORTANT: HERO GAUGE RESET
  const arc = document.getElementById('hero-arc');
  const needle = document.getElementById('hero-needle');
  const pivot = document.getElementById('hero-pivot');
  const pct = document.getElementById('hero-pct');

  // reset arc
  arc.setAttribute('stroke-dashoffset', '345');

  // reset needle position (left side)
  needle.setAttribute('x2', '90');
  needle.setAttribute('y2', '65');

  // reset colors
  pivot.setAttribute('fill', '#aaa');
  needle.setAttribute('stroke', '#aaa');

  // reset text
  pct.textContent = '—';

  // 🔹 MINI METRICS RESET
  document.getElementById('mm-glucose').textContent = '—';
  document.getElementById('mm-bp').textContent = '—';
  document.getElementById('mm-bmi').textContent = '—';
  document.getElementById('mm-age').textContent = '—';

  // 🔹 SCROLL BACK
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });

  // 🔹 optional: default values wapas dikhane ke liye
  setTimeout(() => {
    liveUpdate();
  }, 300);
}
function downloadPDF() {
  window.print();
}
function toggleDarkMode() {
  document.body.classList.toggle('dark');

  if (document.body.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

// Load theme on refresh
window.onload = () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
};