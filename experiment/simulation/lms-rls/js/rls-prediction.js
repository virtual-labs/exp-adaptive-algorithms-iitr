// rls-prediction.js

let desiredChart, mseChart, rwChart;

// Get DOM elements
function getElements() {
  const textInputs = document.querySelectorAll('.param-section input[type="text"]');
  const sliders = document.querySelectorAll('.param-section input[type="range"]');
  
  return {
    nInput: textInputs[0],
    nSlider: sliders[0],
    sigmaInput: textInputs[1],
    sigmaSlider: sliders[1],
    aInput: textInputs[2],
    aSlider: sliders[2],
    lambdaInput: textInputs[3],
    lambdaSlider: sliders[3],
    codeBox: document.getElementById('codeBox'),
    generateBtn: document.querySelector('.btn.large'),
    runBtn: document.querySelectorAll('.btn.small')[1],
    downloadBtn: document.querySelectorAll('.btn.small')[0]
  };
}

// Setup slider synchronization
function setupSliders() {
  const els = getElements();
  
  els.nSlider.oninput = function() { els.nInput.value = this.value; };
  els.nInput.oninput = function() { els.nSlider.value = this.value; };
  
  els.sigmaSlider.oninput = function() { els.sigmaInput.value = this.value; };
  els.sigmaInput.oninput = function() { els.sigmaSlider.value = this.value; };
  
  els.aSlider.oninput = function() { els.aInput.value = this.value; };
  els.aInput.oninput = function() { els.aSlider.value = this.value; };
  
  els.lambdaSlider.oninput = function() { els.lambdaInput.value = this.value; };
  els.lambdaInput.oninput = function() { els.lambdaSlider.value = this.value; };
}

function generateCode() {
  const els = getElements();
  
  const n = parseInt(els.nInput.value);
  const sigma_nu = parseFloat(els.sigmaInput.value);
  const a = parseFloat(els.aInput.value);
  const lambda = parseFloat(els.lambdaInput.value);

  const code = `    function predictor_rls(n, sigma_nu, a, lambda)
    % Initialize variables
    A = -0.98 * ones(1, n);
    mse = zeros(1, n);
    temp = zeros(100, n);
    temp1 = zeros(100, n);

    for k = 1:100
        % Generate the AR(1) process
        u = zeros(1, n);
        nu = sigma_nu * randn(1, n);
        
        for i = 2:n
            u(i) = a * u(i - 1) + nu(i);
        end
        
        % Normalize the input signal
        u = sqrt(1 / var(u)) * u;
        
        % Initialize RLS variables
        w_est = zeros(1, n);  % Filter weights
        P = eye(1) / 0.1;     % Inverse of the covariance matrix
        e = zeros(1, n);      % Error signal
        
        for j = 2:n
            % Regression vector (past values of the input signal)
            phi = u(j - 1);
            
            % Compute the Kalman gain
            k_rls = P * phi / (lambda + phi' * P * phi);
            
            % Calculate the error
            e(j) = u(j) - w_est(j - 1) * phi;
            
            % Update the weights
            w_est(j) = w_est(j - 1) + k_rls' * e(j);
            
            % Update the inverse covariance matrix
            P = (P - k_rls * phi' * P) / lambda;
            
            % Store the squared error
            temp(k, j) = (w_est(j) - a)^2;
            temp1(k, j) = w_est(j);
        end
    end

    % Calculate the mean squared error
    mse = sum(temp) / 100;
    rndwalk = sum(temp1) / 100;

    % Plot desired output
    figure
    stem(1:n, u)
    title('Desired Output')
    xlabel('Number of Samples')
    ylabel('Magnitude')

    % Plot learning curve for RLS
    figure
    plot(1:n, mse, 'r')
    title('Learning curve for RLS')
    xlabel('Number of adaptation cycles, n')
    ylabel('Mean square error')

    % Plot random walk behaviour
    figure
    plot(1:n, A, 'b')
    hold on
    plot(1:n, rndwalk, 'r')
    title('Random Walk behaviour')
    xlabel('Number of adaptation cycles, n')
    ylabel('Tap Weight')
end

% Parameters
n = ${n};
sigma_nu = ${sigma_nu};
a = ${a};
lambda = ${lambda};  % Forgetting factor for RLS

% Call the function
predictor_rls(n, sigma_nu, a, lambda);`;

  els.codeBox.value = code;
  console.log('MATLAB code generated for RLS Prediction');
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
  a.download = 'predictor_rls.m';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Downloaded: predictor_rls.m');
}

// Box-Muller transform for Gaussian random numbers
function randn() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Calculate variance
function variance(arr) {
  const n = arr.length;
  if (n < 2) return 1;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const sumSq = arr.reduce((sq, val) => sq + Math.pow(val - mean, 2), 0);
  return sumSq / (n - 1);
}

function runSimulation() {
  const els = getElements();
  
  const n = parseInt(els.nInput.value);
  const sigma_nu = parseFloat(els.sigmaInput.value);
  const a = parseFloat(els.aInput.value);
  const lambda = parseFloat(els.lambdaInput.value);
  
  console.log('Running RLS Prediction with:', {n, sigma_nu, a, lambda});
  
  // Initialize variables
  const mse = new Array(n).fill(0);
  const temp = Array(100).fill(null).map(() => new Array(n).fill(0));
  const temp1 = Array(100).fill(null).map(() => new Array(n).fill(0));
  
  let u_display = null;
  
  // 100 Monte Carlo runs
  for (let k = 0; k < 100; k++) {
    // Generate AR(1) process
    let u = new Array(n).fill(0);
    let nu = new Array(n).fill(0).map(() => sigma_nu * randn());
    
    for (let i = 1; i < n; i++) {
      u[i] = a * u[i - 1] + nu[i];
    }
    
    // Normalize: u = sqrt(1/var(u)) * u
    const varU = variance(u);
    const normFactor = Math.sqrt(1 / varU);
    u = u.map(val => val * normFactor);
    
    // Save last u for display
    if (k === 99) {
      u_display = [...u];
    }
    
    // Initialize RLS variables
    let w_est = new Array(n).fill(0);
    let P = 1 / 0.1;  // Scalar since it's 1x1
    let e = new Array(n).fill(0);
    
    // RLS algorithm
    for (let j = 1; j < n; j++) {
      // Regression vector (scalar in this case)
      const phi = u[j - 1];
      
      // Compute Kalman gain
      const k_rls = (P * phi) / (lambda + phi * P * phi);
      
      // Calculate error
      e[j] = u[j] - w_est[j - 1] * phi;
      
      // Update weights
      w_est[j] = w_est[j - 1] + k_rls * e[j];
      
      // Update inverse covariance
      P = (P - k_rls * phi * P) / lambda;
      
      // Store squared error
      temp[k][j] = Math.pow(w_est[j] - a, 2);
      temp1[k][j] = w_est[j];
    }
  }
  
  // Calculate mean squared error
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < 100; k++) {
      sum += temp[k][j];
    }
    mse[j] = sum / 100;
  }
  
  // Calculate random walk
  const rndwalk = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < 100; k++) {
      sum += temp1[k][j];
    }
    rndwalk[j] = sum / 100;
  }
  
  console.log('Simulation complete. Plotting graphs...');
  
  plotDesiredOutput(u_display, n);
  plotMSE(mse, n);
  plotRandomWalk(rndwalk, a, n);
}

function plotDesiredOutput(u, n) {
  const canvas = document.getElementById('desiredPlot');
  if (!canvas) {
    console.error('Canvas desiredPlot not found!');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  if (desiredChart) {
    desiredChart.destroy();
  }

  // Optimized stem plot with two datasets
  const stemLines = [];
  const stemPoints = [];
  
  for (let i = 0; i < n; i++) {
    stemLines.push({ x: i, y: 0 });
    stemLines.push({ x: i, y: u[i] });
    stemLines.push({ x: i, y: null });
    stemPoints.push({ x: i, y: u[i] });
  }
  
  // Calculate dynamic y-axis range
  const minU = Math.min(...u);
  const maxU = Math.max(...u);
  const padding = (maxU - minU) * 0.1;
  const yMin = Math.floor(minU - padding);
  const yMax = Math.ceil(maxU + padding);
  
  desiredChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Stems',
          data: stemLines,
          borderColor: '#0072BD',
          borderWidth: 0.5,
          pointRadius: 0,
          showLine: true,
          spanGaps: false
        },
        {
          label: 'Points',
          data: stemPoints,
          borderColor: '#0072BD',
          backgroundColor: '#0072BD',
          pointRadius: 2,
          pointBorderWidth: 0.8,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
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
          min: yMin,
          max: yMax,
          title: {
            display: true,
            text: 'Magnitude',
            font: { size: 12 }
          }
        }
      }
    }
  });
  
  console.log('Desired Output plotted');
}

function plotMSE(mse, n) {
  const canvas = document.getElementById('msePlot');
  if (!canvas) {
    console.error('Canvas msePlot not found!');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  if (mseChart) {
    mseChart.destroy();
  }

  // Calculate dynamic y-axis range
  const validMSE = mse.filter(val => val > 0);
  const minMSE = Math.min(...validMSE);
  const maxMSE = Math.max(...validMSE);
  const padding = (maxMSE - minMSE) * 0.1;
  const yMax = Math.ceil(maxMSE + padding);

  const labels = Array.from({length: n}, (_, i) => i);
  
  mseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'MSE',
        data: mse,
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'Learning Curve for RLS',
          font: { size: 14, weight: 'bold' }
        },
        legend: { display: false }
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
          max: yMax,
          title: {
            display: true,
            text: 'Mean Square Error',
            font: { size: 12 }
          }
        }
      }
    }
  });
  
  console.log('MSE plotted');
}

function plotRandomWalk(weights, trueWeight, n) {
  const canvas = document.getElementById('rwPlot');
  if (!canvas) {
    console.error('Canvas rwPlot not found!');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  if (rwChart) {
    rwChart.destroy();
  }

  const labels = Array.from({length: n}, (_, i) => i);
  const trueWeightArray = new Array(n).fill(-0.98); // Fixed at -0.98
  
  // Calculate dynamic y-axis range with zero at center
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const absMax = Math.max(Math.abs(minWeight), Math.abs(maxWeight), 0.98); // Use 0.98 for symmetry
  const yRange = Math.ceil(absMax * 1.2); // Add 20% padding
  
  rwChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Random Walk',
          data: weights,
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false
        },
        {
          label: 'Original Weight A',
          data: trueWeightArray,
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
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
          min: -yRange,
          max: yRange,
          title: {
            display: true,
            text: 'Tap Weight',
            font: { size: 12 }
          },
          ticks: {
            callback: function(value) {
              return value.toFixed(1);
            }
          }
        }
      }
    }
  });
  
  console.log('Random Walk plotted with fixed true weight at -0.98');
}

// Initialize
window.addEventListener('DOMContentLoaded', function() {
  console.log('RLS Prediction: DOM loaded');
  
  setTimeout(function() {
    setupSliders();
    
    
    const els = getElements();
    
    if (els.generateBtn) {
      els.generateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        generateCode();
      });
      console.log('Generate button connected');
    }
    
    if (els.runBtn) {
      els.runBtn.addEventListener('click', function(e) {
        e.preventDefault();
        runSimulation();
      });
      console.log('Run button connected');
    }
    
    if (els.downloadBtn) {
      els.downloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        downloadCode();
      });
      console.log('Download button connected');
    }
    
    console.log('RLS Prediction module loaded successfully');
  }, 200);
});