// lms-prediction.js

let desiredChart, mseChart, rwChart;

function generateCode() {
  const mu1 = parseFloat(document.getElementById('mu1Val').value);
  const mu2 = parseFloat(document.getElementById('mu2Val').value);
  const mu3 = parseFloat(document.getElementById('mu3Val').value);
  const n = parseInt(document.getElementById('nVal').value);
  const sigma = parseFloat(document.getElementById('sigVal').value);
  const a = parseFloat(document.getElementById('aVal').value);

  const code = `function adaptive_filter(n, mu, sigma_nu, a)
    w = zeros(1, 2000);
    mse = zeros(length(mu), n);
    A(1, 1:200) = -0.98;

    for l = 1:length(mu)
        weight_e_temp = zeros(100, n);
        temp = zeros(100, n);
        temp1 = zeros(100, 200);

        for k = 1:100
            u = zeros(1, n);
            nu = sigma_nu * randn(1, n);

            for i = 2:n
                u(i) = a * u(i - 1) + nu(i);
            endfor

            u = sqrt(1 / var(u)) * u;
            w_est = zeros(1, n + 1);
            e = zeros(1, n);

            for j = 2:n
                e(j) = u(j) - w_est(j) * u(j - 1);
                w_est(j + 1) = w_est(j) + mu(l) * u(j - 1) * e(j);
                weight_e_temp(k, j) = w_est(j);
                temp(k, j) = (weight_e_temp(k, j) - a)^2;
                temp1(k, j) = w_est(j);
            endfor
        endfor

        mse(l, :) = sum(temp) / 100;
        rndwalk = sum(temp1) / 100;
    endfor

    figure
    stem(1:n, u)
    title('Desired Output')
    xlabel('Number of Samples')
    ylabel('Magnitude')

    figure
    plot(1:n, mse(1, :), 'r')
    hold on
    plot(1:n, mse(2, :), 'g')
    plot(1:n, mse(3, :), 'b')
    title('Learning curve for different step sizes')
    xlabel('Number of adaptation cycles, n')
    ylabel('Mean square error')
    legend('mu=0.01', 'mu=0.05', 'mu=0.1')

    figure
    plot(1:200, A, 'b')
    hold on
    plot(1:n, rndwalk, 'r')
    title('Random Walk behaviour')
    xlabel('Number of adaptation cycles, n')
    ylabel('Tap Weight')
endfunction

% Parameters
n = ${n};
mu = [${mu1} ${mu2} ${mu3}];
sigma_nu = ${sigma};
a = ${a};

% Call the function
adaptive_filter(n, mu, sigma_nu, a)`;

  document.getElementById('codeBox').value = code;
}

/* ================= DOWNLOAD CODE ================= */
function downloadCode() {
  const code = document.getElementById('codeBox').value;
  
  if (!code || code.trim() === '' || code === 'Code will be generated here!') {
    alert('Please generate the MATLAB code first by clicking "Generate Code" button.');
    return;
  }
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'adaptive_filter.m';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Downloaded: adaptive_filter.m');
}

// Box-Muller transform for Gaussian random numbers
function randn() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Calculate variance exactly as MATLAB does (divide by n-1)
function variance(arr) {
  const n = arr.length;
  if (n < 2) return 1;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const sumSq = arr.reduce((sq, val) => sq + Math.pow(val - mean, 2), 0);
  return sumSq / (n - 1);  // MATLAB uses n-1
}

function runSimulation() {
  const mu1 = parseFloat(document.getElementById('mu1Val').value);
  const mu2 = parseFloat(document.getElementById('mu2Val').value);
  const mu3 = parseFloat(document.getElementById('mu3Val').value);
  const n = parseInt(document.getElementById('nVal').value);
  const sigma_nu = parseFloat(document.getElementById('sigVal').value);
  const a = parseFloat(document.getElementById('aVal').value);

  const mu = [mu1, mu2, mu3];
  
  console.log('Running LMS with:', {mu, n, sigma_nu, a});
  
  // Initialize MSE and weights arrays for all mu values
  const mse = Array(3).fill(null).map(() => new Array(n).fill(0));
  let rndwalk = new Array(n).fill(0);
  
  // Store last u for display
  let u_display = null;
  
  // Loop over each step size mu
  for (let l = 0; l < 3; l++) {
    const weight_e_temp = [];
    const temp = Array(100).fill(null).map(() => new Array(n).fill(0));
    const temp1 = Array(100).fill(null).map(() => new Array(n).fill(0));
    
    // 100 Monte Carlo runs
    for (let k = 0; k < 100; k++) {
      // Generate AR(1) signal
      let u = new Array(n).fill(0);
      let nu = new Array(n).fill(0).map(() => sigma_nu * randn());
      
      // AR(1) process: u(i) = a * u(i-1) + nu(i)
      for (let i = 1; i < n; i++) {
        u[i] = a * u[i - 1] + nu[i];
      }
      
      // Normalize: u = sqrt(1/var(u)) * u
      const varU = variance(u);
      const normFactor = Math.sqrt(1 / varU);
      u = u.map(val => val * normFactor);
      
      // Save last u for display (from last run, last mu)
      if (l === 2 && k === 99) {
        u_display = [...u];
      }
      
      // LMS algorithm
      let w_est = new Array(n + 1).fill(0);
      let e = new Array(n).fill(0);
      
      for (let j = 1; j < n; j++) {
        // Error: e(j) = u(j) - w_est(j) * u(j-1)
        e[j] = u[j] - w_est[j] * u[j - 1];
        
        // Weight update: w_est(j+1) = w_est(j) + mu * u(j-1) * e(j)
        w_est[j + 1] = w_est[j] + mu[l] * u[j - 1] * e[j];
        
        // Store weight error squared
        temp[k][j] = Math.pow(w_est[j] - a, 2);
        
        // Store weight estimate
        temp1[k][j] = w_est[j];
      }
    }
    
    // Average over 100 runs
    for (let j = 0; j < n; j++) {
      let sumMSE = 0;
      let sumWeight = 0;
      for (let k = 0; k < 100; k++) {
        sumMSE += temp[k][j];
        sumWeight += temp1[k][j];
      }
      mse[l][j] = sumMSE / 100;
      
      // Save random walk for last mu (matches MATLAB behavior where rndwalk gets overwritten)
      if (l === 2) {
        rndwalk[j] = sumWeight / 100;
      }
    }
  }
  
  console.log('MSE at start:', mse[0][1], mse[1][1], mse[2][1]);
  console.log('MSE at end:', mse[0][n-1], mse[1][n-1], mse[2][n-1]);
  console.log('Final weight:', rndwalk[n-1], 'Target:', a);

  // Plot graphs
  plotDesiredOutput(u_display);
  plotMSE(mse, mu, n);
  plotRandomWalk(rndwalk, a, n);
}

function plotDesiredOutput(u) {
  const ctx = document.getElementById('desiredPlot').getContext('2d');
  
  if (desiredChart) {
    desiredChart.destroy();
  }

  const n = u.length;
  const datasets = [];
  
  // Create stem plot: vertical lines with circles on top
  for (let i = 0; i < n; i++) {
    datasets.push({
      data: [{ x: i, y: 0 }, { x: i, y: u[i] }],
      borderColor: '#0072BD',
      borderWidth: 0.5,
      showLine: true,
      tension: 0,
      pointRadius: [0, 2.5],
      pointHoverRadius: [0, 2.5],
      pointBackgroundColor: ['rgba(0,0,0,0)', '#ffffff'],
      pointBorderColor: ['rgba(0,0,0,0)', '#0072BD'],
      pointBorderWidth: 0.8
    });
  }
  
  desiredChart = new Chart(ctx, {
    type: 'scatter',
    data: { datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.8,
      plugins: {
        title: {
          display: true,
          text: 'Desired Output',
          font: { size: 14, weight: 'bold' }
        },
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: n,
          title: {
            display: true,
            text: 'Number of Samples',
            font: { size: 12 }
          }
        },
        y: {
          min: -4,
          max: 4,
          title: {
            display: true,
            text: 'Magnitude',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

function plotMSE(mse, mu, n) {
  const ctx = document.getElementById('msePlot').getContext('2d');
  
  if (mseChart) {
    mseChart.destroy();
  }

  const labels = Array.from({length: n}, (_, i) => i);
  
  mseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'mu=' + mu[0].toFixed(2),
          data: mse[0],
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: 'mu=' + mu[1].toFixed(2),
          data: mse[1],
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: 'mu=' + mu[2].toFixed(1),
          data: mse[2],
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.8,
      plugins: {
        title: {
          display: true,
          text: 'Learning Curve for Different Step Sizes',
          font: { size: 14, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: false,
            boxWidth: 40
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: n,
          title: {
            display: true,
            text: 'Number of adaptation cycles, n',
            font: { size: 12 }
          }
        },
        y: {
          min: 0,
          max: 0.25,
          title: {
            display: true,
            text: 'Mean Square Error',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

function plotRandomWalk(weights, trueWeight, n) {
  const ctx = document.getElementById('rwPlot').getContext('2d');
  
  if (rwChart) {
    rwChart.destroy();
  }

  const labels = Array.from({length: n}, (_, i) => i);
  
  // True Weight A only for first 200 samples
  const trueWeightArray = new Array(n).fill(null);
  for (let i = 0; i < Math.min(200, n); i++) {
    trueWeightArray[i] = -0.98;
  }
  
  rwChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Estimated Weight',
          data: weights,
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: 'True Weight A',
          data: trueWeightArray,
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0,
          spanGaps: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.8,
      plugins: {
        title: {
          display: true,
          text: 'Random Walk Behaviour',
          font: { size: 14, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: false,
            boxWidth: 40
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: n,
          title: {
            display: true,
            text: 'Number of adaptation cycles, n',
            font: { size: 12 }
          }
        },
        y: {
          min: -1,
          max: 0.6,
          title: {
            display: true,
            text: 'Tap Weight',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Sync slider functions
function syncMu1(val) {
  document.getElementById('mu1Val').value = val;
}
function syncMu2(val) {
  document.getElementById('mu2Val').value = val;
}
function syncMu3(val) {
  document.getElementById('mu3Val').value = val;
}
function syncN(val) {
  document.getElementById('nVal').value = val;
}
function syncSigma(val) {
  document.getElementById('sigVal').value = val;
}
function syncA(val) {
  document.getElementById('aVal').value = val;
}

// Initialize
window.addEventListener('load', function() {
  console.log('LMS Prediction: DOM loaded');
  

  
  // Set up button event listeners
  const generateBtn = document.querySelector('.btn.large');
  const runBtn = document.querySelectorAll('.btn.small')[1]; // Second small button
  const downloadBtn = document.querySelectorAll('.btn.small')[0]; // First small button
  
  if (generateBtn) {
    generateBtn.addEventListener('click', function(e) {
      e.preventDefault();
      generateCode();
    });
    console.log('Generate button connected');
  }
  
  if (runBtn) {
    runBtn.addEventListener('click', function(e) {
      e.preventDefault();
      runSimulation();
    });
    console.log('Run button connected');
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      downloadCode();
    });
    console.log('Download button connected');
  }
  
  console.log('LMS Prediction module loaded successfully');
});