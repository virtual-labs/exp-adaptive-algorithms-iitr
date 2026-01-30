let mseChart = null;
let currentAlgorithm = "LMS";
let currentApplication = "Prediction";

/* ================= TAB HANDLERS ================= */
function selectAlgorithm(algo) {
  currentAlgorithm = algo;
  document.querySelectorAll(".tab-container")[0]
    .querySelectorAll(".tab-btn")
    .forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

function selectApplication(app) {
  currentApplication = app;
  document.querySelectorAll(".tab-container")[1]
    .querySelectorAll(".tab-btn")
    .forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

/* ================= SLIDER SYNC ================= */
function syncMu(val) {
  document.getElementById("muVal").value = val;
}
function syncN(val) {
  document.getElementById("nVal").value = val;
}
function syncSignal(val) {
  document.getElementById("sigVal").value = val;
}
function syncNoise(val) {
  document.getElementById("noiseVal").value = val;
}

/* ================= MATLAB CODE GENERATION ================= */
function generateCode() {
  const N = document.getElementById("nVal").value;
  const mu = document.getElementById("muVal").value;
  const sig = document.getElementById("sigVal").value;
  const noise = document.getElementById("noiseVal").value;

  const code = `function lms_equal(N, signal_power, noise_power, mu)
    % N: Number of samples
    % signal_power: Power of the signal
    % noise_power: Power of the noise
    % mu: Step size for LMS algorithm

    h = [2 1];  % Impulse response of channel
    x = sqrt(signal_power) .* randn(1, N);  % Input signal
    d = conv(x, h);
    d = d(1:N) + sqrt(noise_power) .* randn(1, N);  % Introduction of noise

    w0(1) = 0;  % Initial filter weights
    w1(1) = 0;

    y(1) = w0(1) * x(1);  % Filter output
    e(1) = d(1) - y(1);  % Error signal
    w0(2) = w0(1) + 2 * mu * e(1) * x(1);  % Update weights
    w1(2) = w1(1);  % Update weights

    for n = 2:N  % LMS algorithm
        y(n) = w0(n) * x(n) + w1(n) * x(n-1);  % Filter output
        e(n) = d(n) - y(n);  % Error signal
        w0(n+1) = w0(n) + mu * e(n) * x(n);  % Update weight
        w1(n+1) = w1(n) + mu * e(n) * x(n-1);  % Update weight
    end

    mse = zeros(1, N);
    for i = 1:N
        mse(i) = abs(e(i)).^2;
    end

    n = 1:N;
    semilogy(n, mse);  % MSE versus time
    xlabel('Adaptation cycles');
    ylabel('MSE');
    title('Adaptation cycles vs. MSE');
end

% Example usage:
N = ${N};  % Number of samples
signal_power = ${sig};  % Signal power
noise_power = ${noise};  % Noise power
mu = ${mu};  % Step size for LMS algorithm

lms_equal(N, signal_power, noise_power, mu);`;

  document.getElementById("codeBox").value = code;
}

/* ================= DOWNLOAD CODE ================= */
function downloadCode() {
  const code = document.getElementById("codeBox").value;
  
  if (!code || code.trim() === '' || code === 'Code will be generated here!') {
    alert('Please generate the MATLAB code first by clicking "Generate Code" button.');
    return;
  }
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lms_equal.m';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Downloaded: lms_equal.m');
}

/* ================= RANDOM NORMAL (randn) ================= */
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ================= LMS CORE (MATCHES MATLAB) ================= */
function runSimulation() {
  const N = parseInt(document.getElementById("nVal").value);
  const mu = parseFloat(document.getElementById("muVal").value);
  const signal_power = parseFloat(document.getElementById("sigVal").value);
  const noise_power = parseFloat(document.getElementById("noiseVal").value);

  const h = [2, 1];
  const x = new Array(N);
  const d = new Array(N);
  const y = new Array(N);
  const e = new Array(N);
  const mse = new Array(N);

  for (let i = 0; i < N; i++) {
    x[i] = Math.sqrt(signal_power) * randn();
  }

  for (let i = 0; i < N; i++) {
    let conv = h[0] * x[i];
    if (i > 0) conv += h[1] * x[i - 1];
    d[i] = conv + Math.sqrt(noise_power) * randn();
  }

  let w0 = [0, 0];
  let w1 = [0, 0];

  y[0] = w0[0] * x[0];
  e[0] = d[0] - y[0];
  w0[1] = w0[0] + 2 * mu * e[0] * x[0];
  w1[1] = w1[0];

  for (let n = 1; n < N; n++) {
    y[n] = w0[n] * x[n] + w1[n] * x[n - 1];
    e[n] = d[n] - y[n];
    w0[n + 1] = w0[n] + mu * e[n] * x[n];
    w1[n + 1] = w1[n] + mu * e[n] * x[n - 1];
  }

  for (let i = 0; i < N; i++) {
    mse[i] = e[i] * e[i];
  }

  plotMSE(mse);
}

/* ================= PLOT (SEMILOGY) ================= */
function plotMSE(mse) {
  const ctx = document.getElementById("errorPlot").getContext("2d");

  if (mseChart) mseChart.destroy();

  const N = mse.length;

  mseChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: mse.map((_, i) => i + 1),
      datasets: [{
        label: "Mean Square Error",
        data: mse,
        borderColor: "#1f77b4",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Adaptation cycles vs. MSE",
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: N,
          title: {
            display: true,
            text: "Adaptation cycles",
            font: {
              size: 12
            }
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          type: "logarithmic",
          min: 1e-8,
          max: 1e2,
          title: {
            display: true,
            text: "MSE",
            font: {
              size: 12
            }
          },
          ticks: {
            callback: function(value, index, values) {
              // Format as 10^x
              const exponent = Math.log10(value);
              if (Number.isInteger(exponent)) {
                return '10^' + exponent;
              }
              return null;
            },
            autoSkip: false,
            maxTicksLimit: 11
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
}

/* ================= INITIALIZATION ================= */
window.addEventListener('DOMContentLoaded', function() {
  console.log('LMS Equalization: DOM loaded');
  
 
  
  // Setup download button
  const downloadBtn = document.querySelector('.btn.small');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      downloadCode();
    });
    console.log('Download button connected');
  }
  
  console.log('LMS Equalization module loaded successfully');
});