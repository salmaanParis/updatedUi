document.getElementById('doneButton').addEventListener('click', async () => {
    const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (tab.url.startsWith('chrome://')) {
      alert('This extension cannot be run on chrome:// URLs.');
      return;
    }
  
    const checkAllLinks = document.getElementById('checkAllLinks').checked;
    const checkBrokenLinks = document.getElementById('checkBrokenLinks').checked;
    const checkLocalLanguageLinks = document.getElementById('checkLocalLanguageLinks').checked;
    const checkAllDetails = document.getElementById('checkAllDetails').checked;
  
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: checkLinks,
        args: [checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails]
      });
  
      // Store results in localStorage for later use by the preview button
      localStorage.setItem('linkResults', JSON.stringify(results[0].result));
      alert('Completed');
    } catch (error) {
      console.error(error);
      alert('An error occurred while checking links.');
    }
  });
  
  document.getElementById('previewButton').addEventListener('click', () => {
    const results = JSON.parse(localStorage.getItem('linkResults'));
    if (results) {
      document.getElementById('result').style.display = 'block';
      displayAllLinks(results.allLinks);
      displayBrokenLinks(results.brokenLinks);
      displayLocalLanguageLinks(results.localLanguageLinks);
    } else {
      alert('No data to preview. Please click "Done" first.');
    }
  });
  
  document.getElementById('downloadPdfButton').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.text('All Links', 10, 10);
    doc.autoTable({ html: '#allLinksTable', startY: 20 });
    doc.addPage();
    doc.text('Broken Links', 10, 10);
    doc.autoTable({ html: '#brokenLinksTable', startY: 20 });
    doc.addPage();
    doc.text('Local Language Links', 10, 10);
    doc.autoTable({ html: '#localLanguageLinksTable', startY: 20 });
  
    doc.save('links_report.pdf');
  });
  
  document.getElementById('downloadExcelButton').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
  
    const allLinksTable = document.getElementById('allLinksTable');
    const brokenLinksTable = document.getElementById('brokenLinksTable');
    const localLanguageLinksTable = document.getElementById('localLanguageLinksTable');
  
    const allLinksSheet = XLSX.utils.table_to_sheet(allLinksTable);
    const brokenLinksSheet = XLSX.utils.table_to_sheet(brokenLinksTable);
    const localLanguageLinksSheet = XLSX.utils.table_to_sheet(localLanguageLinksTable);
  
    XLSX.utils.book_append_sheet(wb, allLinksSheet, 'All Links');
    XLSX.utils.book_append_sheet(wb, brokenLinksSheet, 'Broken Links');
    XLSX.utils.book_append_sheet(wb, localLanguageLinksSheet, 'Local Language Links');
  
    XLSX.writeFile(wb, 'links_report.xlsx');
  });
  
  function displayAllLinks(links) {
    let html = '<table><tr><th>Link</th><th>Status</th></tr>';
    links.forEach(link => {
      html += `<tr><td>${link.url}</td><td>${link.status}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('allLinksTable').innerHTML = html;
  }
  
  function displayBrokenLinks(links) {
    let html = '<table><tr><th>Link</th><th>Status</th></tr>';
    links.forEach(link => {
      html += `<tr><td>${link.url}</td><td>${link.status}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('brokenLinksTable').innerHTML = html;
  }
  
  function displayLocalLanguageLinks(links) {
    let html = '<table><tr><th>Link</th><th>Status</th></tr>';
    links.forEach(link => {
      html += `<tr><td>${link.url}</td><td>${link.status}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('localLanguageLinksTable').innerHTML = html;
  }
  
  async function checkLinks(checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails) {
    const allLinks = [];
    const brokenLinks = [];
    const localLanguageLinks = [];
    const localLanguageList = [
      'ar-aa', 'be-by', 'bg-bg', 'ca-es', 'cs-cz', 'da-dk', 'de-ch', 'de-de', 'el-gr',
      'en-au', 'en-be', 'en-gb', 'en-jp', 'en-us', 'en-za', 'es-es', 'fi-fi', 'fr-be',
      'fr-ca', 'fr-ch', 'fr-fr', 'hr-hr', 'hu-hu', 'is-is', 'it-ch', 'it-it', 'iw-il',
      'ja-jp', 'ko-kr', 'lt-lt', 'lv-lv', 'mk-mk', 'nl-be', 'nl-nl', 'no-no', 'pl-pl',
      'pt-br', 'pt-pt', 'ro-ro', 'ru-ru', 'sh-sp', 'sk-sk', 'sl-sl', 'sq-al', 'sv-se',
      'th-th', 'tr-tr', 'uk-ua', 'zh-cn', 'zh-tw'
    ];
  
    const links = Array.from(document.querySelectorAll('a')).map(link => link.href);
    
    for (const url of links) {
      try {
        const response = await fetch(url);
        const status = response.status;
        if (checkAllLinks || checkAllDetails) allLinks.push({ url, status });
        if ((checkBrokenLinks || checkAllDetails) && (status >= 400)) brokenLinks.push({ url, status });
        if ((checkLocalLanguageLinks || checkAllDetails) && localLanguageList.some(language => url.includes(language))) {
          localLanguageLinks.push({ url, status });
        }
      } catch (error) {
        if (checkBrokenLinks || checkAllDetails) brokenLinks.push({ url, status: 'error' });
      }
    }
  
    return { allLinks, brokenLinks, localLanguageLinks };
  }
  