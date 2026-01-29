// rls-equalization.js

let mseChart;

// Get DOM elements
function getElements() {
  const textInputs = document.querySelectorAll('.param-section input[type="text"]');
  const sliders = document.querySelectorAll('.param-section input[type="range"]');
  const buttons = document.querySelectorAll('.btn');

  console.log('Found text inputs:', textInputs.length);
  console.log('Found sliders:', sliders.length);
  console.log('Found buttons:', buttons.length);

  return {
    wInput: textInputs[0],
    wSlider: sliders[0],
    xiInput: textInputs[1],
    xiSlider: sliders[1],
    nInput: textInputs[2],
    nSlider: sliders[2],
    snrInput: textInputs[3],
    snrSlider: sliders[3],
    lInput: textInputs[4],
    lSlider: sliders[4],
    delayInput: textInputs[5],
    delaySlider: sliders[5],
    codeBox: document.getElementById('codeBox'),
    generateBtn: document.querySelector('.btn.large'),
    runBtn: buttons[1], // Second button (Submit & Run)
    downloadBtn: buttons[0] // First button (Download)
  };
}

// Sync sliders with text inputs
function setupSliders() {
  const els = getElements();

  // W
  els.wSlider.oninput = function () {
    els.wInput.value = this.value;
  };
  els.wInput.oninput = function () {
    els.wSlider.value = this.value;
  };

  // xi_R
  els.xiSlider.oninput = function () {
    els.xiInput.value = this.value;
  };
  els.xiInput.oninput = function () {
    els.xiSlider.value = this.value;
  };

  // N
  els.nSlider.oninput = function () {
    els.nInput.value = this.value;
  };
  els.nInput.oninput = function () {
    els.nSlider.value = this.value;
  };

  // SNR
  els.snrSlider.oninput = function () {
    els.snrInput.value = this.value;
  };
  els.snrInput.oninput = function () {
    els.snrSlider.value = this.value;
  };

  // L
  els.lSlider.oninput = function () {
    els.lInput.value = this.value;
  };
  els.lInput.oninput = function () {
    els.lSlider.value = this.value;
  };

  // Delay
  els.delaySlider.oninput = function () {
    els.delayInput.value = this.value;
  };
  els.delayInput.oninput = function () {
    els.delaySlider.value = this.value;
  };
}

function generateCode() {
  const els = getElements();

  const W = parseFloat(els.wInput.value);
  const xi_R = parseFloat(els.xiInput.value);
  const N = parseInt(els.nInput.value);
  const SNR_dB = parseFloat(els.snrInput.value);
  const L = parseInt(els.lInput.value);
  const delay = parseInt(els.delayInput.value);

  const code = `    function eqrls(W, xi_R, N, SNR_dB,L,delay)
    num_runs=100;
    delta=0.04;
     % Preallocate for Mean Squared Error
     MSE_sum = zeros(1, N-delay);
 
 
     for run = 1:num_runs
         % Generate Bernoulli sequence x_n for this run
         x_n = 2 * randi([0 1], N, 1) - 1;
 
         % Desired response
         d_n = [x_n(delay+1:end); zeros(delay, 1)]; % Delayed version of input signal
 
         % Initialize RLS algorithm
         w = zeros(L, 1);
         P = (1/delta) * eye(L);
         lambda = 1; % Forgetting factor (not used here but included for completeness)
 
         % Preallocate for Mean Squared Error for this run
         MSE = zeros(1, N-delay);
 
         for n = L:N-delay
             % Input vector for predictor
             u_n = x_n(n:-1:n-L+1);
 
             % RLS algorithm
             k_n = (P * u_n) / (lambda + u_n' * P * u_n);
             e_n = d_n(n) - w' * u_n;
             w = w + k_n * e_n;
             P = (P - k_n * u_n' * P) / lambda;
 
             % Mean Squared Error
             MSE(n) = e_n^2;
         end
 
         % Accumulate MSE for this run
         MSE_sum = MSE_sum + MSE;
     end
 
     % Ensemble average MSE
     MSE_avg = MSE_sum / num_runs;
 
     % Plot results
     figure;
     plot(10*log10(MSE_avg));
     xlabel('Sample Index');
     ylabel('MSE (dB)');
     title(sprintf('Adaptive Equalisation RLS'));
     grid on;
 end

W = ${W};
xi_R = ${xi_R};
N = ${N};
SNR_dB = ${SNR_dB};
L = ${L};
delay = ${delay};

eqrls(W, xi_R, N, SNR_dB, L, delay);`;

  els.codeBox.value = code;
  console.log('MATLAB code generated');
}

/* ================= DOWNLOAD CODE ================= */
function downloadCode() {
  const els = getElements();
  const code = els.codeBox.value;
  
  if (!code || code.trim() === '' || code === 'Code will be generated here!') {
    alert('Please generate the MATLAB code first by clicking "Generate Code" button.');
    return;
  }
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eqrls.m';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Downloaded: eqrls.m');
}

// Matrix operations
function matrixMultiply(A, B) {
  const m = A.length;
  const n = A[0].length;
  const p = B[0].length;

  const result = Array(m).fill(null).map(() => Array(p).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < n; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }

  return result;
}

function matrixScalarMultiply(A, scalar) {
  return A.map(row => row.map(val => val * scalar));
}

function matrixSubtract(A, B) {
  const m = A.length;
  const n = A[0].length;

  const result = Array(m).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = A[i][j] - B[i][j];
    }
  }

  return result;
}

function identityMatrix(size) {
  const I = Array(size).fill(null).map(() => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    I[i][i] = 1;
  }
  return I;
}

function vectorDotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function outerProduct(a, b) {
  const m = a.length;
  const n = b.length;

  const result = Array(m).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = a[i] * b[j];
    }
  }

  return result;
}

function runSimulation() {
  const els = getElements();

  const W = parseFloat(els.wInput.value);
  const xi_R = parseFloat(els.xiInput.value);
  const N = parseInt(els.nInput.value);
  const SNR_dB = parseFloat(els.snrInput.value);
  const L = parseInt(els.lInput.value);
  const delay = parseInt(els.delayInput.value);

  console.log('Running RLS Equalization with:', { W, xi_R, N, SNR_dB, L, delay });

  const num_runs = 100;
  const delta = 0.04;
  const lambda = 1;

  const MSE_sum = new Array(N).fill(0);

  for (let run = 0; run < num_runs; run++) {
    const x_n = new Array(N);
    for (let i = 0; i < N; i++) {
      x_n[i] = 2 * Math.round(Math.random()) - 1;
    }

    const d_n = new Array(N);
    for (let i = 0; i < N - delay; i++) {
      d_n[i] = x_n[i + delay];
    }
    for (let i = N - delay; i < N; i++) {
      d_n[i] = 0;
    }

    let w = new Array(L).fill(0);
    let P = matrixScalarMultiply(identityMatrix(L), 1 / delta);

    const MSE = new Array(N).fill(0);

    for (let n = L - 1; n < N - delay; n++) {
      const u_n = [];
      for (let i = 0; i < L; i++) {
        u_n[i] = x_n[n - i];
      }

      const P_u = new Array(L).fill(0);
      for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
          P_u[i] += P[i][j] * u_n[j];
        }
      }

      let u_P_u = 0;
      for (let i = 0; i < L; i++) {
        u_P_u += u_n[i] * P_u[i];
      }

      const denominator = lambda + u_P_u;
      const k_n = P_u.map(val => val / denominator);

      const w_u = vectorDotProduct(w, u_n);
      const e_n = d_n[n] - w_u;

      for (let i = 0; i < L; i++) {
        w[i] += k_n[i] * e_n;
      }

      const k_u_outer = outerProduct(k_n, u_n);
      const k_u_P = matrixMultiply(k_u_outer, P);
      P = matrixSubtract(P, k_u_P);
      P = matrixScalarMultiply(P, 1 / lambda);

      MSE[n] = e_n * e_n;
    }

    for (let i = 0; i < N; i++) {
      MSE_sum[i] += MSE[i];
    }
  }

  const MSE_avg = MSE_sum.map(val => val / num_runs);

  const MSE_dB = MSE_avg.map(val => {
    if (val <= 1e-10) return 0;
    return 10 * Math.log10(val);
  });

  console.log('Simulation complete. Plotting...');
  plotMSE(MSE_dB, N);
}

function plotMSE(MSE_dB, N) {
  let canvas = document.getElementById('rlsMseChart');

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'rlsMseChart';
    document.querySelector('.simulation-wrapper').appendChild(canvas);
  }

  // Set explicit canvas dimensions
  canvas.width = 1200;
  canvas.height = 500;
  canvas.style.width = '100%';
  canvas.style.maxWidth = '1200px';
  canvas.style.height = 'auto';
  canvas.style.margin = '40px auto';
  canvas.style.display = 'block';

  if (mseChart) mseChart.destroy();

  // Calculate dynamic y-axis range
  const validMSE = MSE_dB.filter(val => isFinite(val) && val !== 0);
  const minMSE = Math.min(...validMSE);
  const maxMSE = Math.max(...validMSE);
  
  // Add some padding to the range
  const padding = (maxMSE - minMSE) * 0.1;
  const yMin = Math.floor(minMSE - padding);
  const yMax = Math.ceil(maxMSE + padding);

  console.log('Y-axis range:', yMin, 'to', yMax);

  // Create labels from 0 to N
  const labels = Array.from({ length: N }, (_, i) => i);

  mseChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'MSE (dB)',
        data: MSE_dB,
        borderColor: '#1f77b4',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2.4,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'Adaptive Equalisation RLS',
          font: { size: 14, weight: 'bold' }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: N,
          title: {
            display: true,
            text: 'Sample Index',
            font: { size: 12 }
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          min: yMin,
          max: yMax,
          title: {
            display: true,
            text: 'MSE (dB)',
            font: { size: 12 }
          },
          ticks: {
            stepSize: Math.ceil((yMax - yMin) / 7)
          }
        }
      }
    }
  });

  console.log('Graph plotted successfully');
}

// Initialize
window.addEventListener('DOMContentLoaded', function () {
  console.log('RLS Equalization: DOM loaded');
  
  // Wait for DOM to fully settle
  setTimeout(function() {
    setupSliders();
   
    // Get buttons directly without using getElements
    const generateBtn = document.querySelector('.btn.large');
    const smallButtons = document.querySelectorAll('.btn.small');
    const downloadBtn = smallButtons[0];
    const runBtn = smallButtons[1];
    
    console.log('Buttons found:', {
      generate: !!generateBtn,
      download: !!downloadBtn,
      run: !!runBtn,
      smallCount: smallButtons.length
    });

    if (generateBtn) {
      generateBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Generate button clicked');
        generateCode();
      });
      console.log('Generate button connected');
    } else {
      console.error('Generate button not found');
    }

    if (runBtn) {
      runBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Run button clicked');
        runSimulation();
      });
      console.log('Run button connected');
    } else {
      console.error('Run button not found');
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('Download button clicked');
        downloadCode();
      });
      console.log('Download button connected');
    } else {
      console.error('Download button not found');
    }

    console.log('RLS Equalization module loaded successfully');
  }, 200);
});