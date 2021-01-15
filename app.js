const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = `apikey=41ec2fb9-3bf9-48ba-88de-03e157ec92fa`

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data
    } catch (error) {
      console.error(error);
    }
}

async function fetchAllCenturies() {
    //https://api.harvardartmuseums.org/century?apikey=YOUR_API_KEY&size=100&sort=temporalorder
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records
        
      localStorage.setItem("centuries", JSON.stringify(records))
      return records
    } catch (error) {
      console.error(error);
    }
}

async function fetchAllClassifications() {
  //https://api.harvardartmuseums.org/century?apikey=YOUR_API_KEY&size=100&sort=temporalorder
  const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
  if (localStorage.getItem('classifications')) {
      return JSON.parse(localStorage.getItem('classifications'));
  }
  try {
    const response = await fetch(url);
    const data = await response.json();
    const classifications = data.records
    localStorage.setItem("classifications",JSON.stringify(classifications))
    return classifications
  } catch (error) {
    console.error(error);
  }
}

function onFetchStart() {
  $('#loading').addClass('active');
}

function onFetchEnd() {
  $('#loading').removeClass('active');
}

async function prefetchCategoryLists() {
  try {
    const [
      classifications, centuries
    ] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies()
    ]);

    $('.classification-count').text(`(${ classifications.length })`);
    const classification = $("#select-classification")
    classifications.forEach((value) => {
      const option = $("<option>").attr("value", value.name).text(value.name)
      classification.append(option)
    })

    const century = $("#select-century")
    $('.century-count').text(`(${ centuries.length })`);
    centuries.forEach((value) => {
      const option = $("<option>").attr("value", value.name).text(value.name)
      century.append(option)
    })

  } catch (error) {
    console.error(error);
  }
}

function buildSearchString() {
  const classification = $("#select-classification").val()
  const century = $("#select-century").val()
  const keywords = $("#keywords").val()

  //https://api.harvardartmuseums.org/object?apikey=YOUR_KEY_HERE&classification=Photographs&century=19th century&keyword=face
  const SEARCH_URL = `${BASE_URL}/object?${KEY}&classification=${classification}&century=${century}&keyword=${keywords}`
  const encodedUrl = encodeURI(SEARCH_URL); 
  console.log(encodedUrl)
  return encodedUrl
}

function renderPreview(record) {
  // grab description, primaryimageurl, and title from the record
  const description = record.description
  const images = record.primaryimageurl
  const title = record.title

  const div = $('<div>').addClass('object-preview')
    .html(`
    <a href="#">
    <img src="${ images ? images : ""}" />
    <h3>${title ? title : ""}</h3>
    </a>
    `).data('record', record)
  
  return div
  /*
  Template looks like this:

  <div class="object-preview">
    <a href="#">
      <img src="image url" />
      <h3>Record Title</h3>
      <h3>Description</h3>
    </a>
  </div>

  Some of the items might be undefined, if so... don't render them

  With the record attached as data, with key 'record'
  */

  // return new element
}

function searchURL(searchType, searchString) {
  return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
}

function factHTML(title, content, searchTerm = null) {
  // if content is empty or undefined, return an empty string ''
  if(!content)
    return ''
  // otherwise, if there is no searchTerm, return the two spans
  else if(!searchTerm)
    return `<span class="title">${title}</span>
    <span class="content">${content}</span>`
  // otherwise, return the two spans, with the content wrapped in an anchor tag
  else 
    return `
      <span class="title">${title}</span>
      <span class="content">
        <a href="${searchURL(searchTerm, content)}">${content}</a>
      </span>
      `
}

function photosHTML(images, primaryimageurl) {
  // if images is defined AND images.length > 0, map the images to the correct image tags, then join them into a single string.  the images have a property called baseimageurl, use that as the value for src
  //console.log(images)
  //console.log(primaryimageurl)
  if(images.length > 0) {
    const imageTags = images.map(
      image => `<img src="${image.baseimageurl}" />`).join('')
    console.log(imageTags)
    return imageTags
    // else if primaryimageurl is defined, return a single image tag with that as value for src
  } else if (primaryimageurl) {
    return `<img src="${primaryimageurl}" />`
    // else we have nothing, so return the empty string
  } else {
    return ``
  }
}

function renderFeature(record) {
  /**
   * We need to read, from record, the following:
   * HEADER: title, dated
   * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
   * PHOTOS: images, primaryimageurl
   */

  const {
    //header
    title, dated, 
    //photos
    images, primaryimageurl,
    //facts
    description, culture, style, technique, medium, 
    dimensions, people, department, division, contact, creditline,
  
  } = record

  const div = $('<div>').addClass('object-feature')
    .html(`
    <header>
      <h3>${title}</h3>
      <h4>${dated}</h4>
    </header>
    <section class="facts">
      ${factHTML('Description', description)}
      ${factHTML('Culture', culture, 'culture')}
      ${factHTML('Style', style)}
      ${factHTML('Technique', technique, 'technique')}
      ${factHTML('Medium', medium ? medium.toLowerCase() : null, 'medium')}
      ${factHTML('Dimensions', dimensions)}
      ${people ? people.map(
        (person) => factHTML('Person', person.displayname, 'person'))
        .join('') : ""}
      ${ factHTML('Department', department)}
      ${ factHTML('Division', division)}
      ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
      ${ factHTML('Credit', creditline)}
    </section>
    <section class="photos">
      ${photosHTML(images, primaryimageurl)}
    </section>
  </div>
    `)
  // build and return template
  return div
}

function updatePreview(records, info) {
  const root = $('#preview');

  if(info.next) {
    const nextButton = $('.next').data("url", info.next)
    nextButton.attr('disabled', false)
  } else {
    const nextButton = $('.next').data("url", null)
    nextButton.attr('disabled', true)
  }

  if(info.prev) {
    const prevButton = $('.previous').data("url", info.prev)
    prevButton.attr('disabled', false)
  } else {
    const prevButton = $('.previous').data("url", null)
    prevButton.attr('disabled', true)
  }
  /*
    if info.next is present:
      - on the .next button set data with key url equal to info.next
      - also update the disabled attribute to false
    else
      - set the data url to null
      - update the disabled attribute to true


    Do the same for info.prev, with the .previous button
  */

  // grab the results element, it matches .results inside root
  const results = root.find('.results')
  // empty it
  results.empty()
  // loop over the records, and append the renderPreview
  console.log(records)
  records.forEach((record) => {
    results.append(renderPreview(record))
  })
}

$('#search').on('submit', async function (event) {
  // prevent the default
  event.preventDefault()
  try {
    onFetchStart()
    // get the url from `buildSearchString`
    const SEARCH_URL = buildSearchString()
    // fetch it with await, store the result
    const result = await fetch(SEARCH_URL)
    console.log(result)
    // log out both info and records when you get them
    const info = await result.json()
    const records = info.records
    //console.log(info.info)
    //console.log(records)
    updatePreview(records, info.info)
  } catch (error) {
    // log out the error
    console.log(error)
  } finally {
    onFetchEnd()
  }
});

$('#preview .next, #preview .previous').on('click', async function () {
  /*
    read off url from the target 
    fetch the url
    read the records and info from the response.json()
    update the preview
  */
  try {
    onFetchStart()
    const buttonURL = $(this).data('url')
    const result = await fetch(buttonURL)
    const data = await result.json()
    updatePreview(data.records, data.info)
  } catch (error) {
    console.log(error)
  } finally {
    onFetchEnd()
  }
});

$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault(); // they're anchor tags, so don't follow the link
  // find the '.object-preview' element by using .closest() from the target
  const elem = $(this).closest('.object-preview')
  const data = elem.data('record')
  //console.log(data)
  // recover the record from the element using the .data('record') we attached
  // log out the record object to see the shape of the data
  const feature = $("#feature")
  feature.html(renderFeature(data))
});

$('#feature').on('click', 'a', async function (event) {
  if (href.startsWith('mailto')) 
    return
  // read href off of $(this) with the .attr() method
  const SEARCH_URL = $(this).attr('href')
  //console.log("searchURL",SEARCH_URL)
  // prevent default
  event.preventDefault()
  // call onFetchStart
  try {
    onFetchStart()
    const response = await fetch(SEARCH_URL)
    const data = await response.json()
    console.log(data)
    updatePreview(data.records, data.info)
  } catch (error) {
    console.log(error)
  } finally {
    onFetchEnd()
  }
  // fetch the href
  // render it into the preview
  // call onFetchEnd
});

prefetchCategoryLists()

//fetchAllClassifications().then(x => console.log(x))

//fetchObjects().then(x => console.log(x));