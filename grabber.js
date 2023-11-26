materialObj = {
    title: null,
    fileSrc: null,
    init: function(elem){
        materialObj.clean();
        let titleCss = 'p.additional-materials__name';
        let fileCss = 'a.additional-materials__file-left';
        materialObj.title = elem.querySelector(titleCss).innerText;
        materialObj.fileSrc = elem.querySelector(fileCss).getAttribute('href');
    },
    clean: function(){
        materialObj.title = null;
        materialObj.fileSrc = null;
    }
}
lessonObj = {
    title: null,
    description: null,
    url: null,
    videoSrc: null,
    materials: [],
    initMaterials: function(){
        let listCss = '.lesson-materials__list li';
        $(listCss).each(function(i,e){
            materialObj.init(e);
            lessonObj.materials.push(Object.assign({}, materialObj))
        })
    },
    clean: function(){
        lessonObj.title = null;
        lessonObj.description = null;
        lessonObj.url = null;
        lessonObj.videoSrc = null;
        lessonObj.materials = [];
    },
    init: async function(){
        lessonObj.clean();
        let titleCss = '.breadcrumbs li:nth-child(3) a, div.tests-header__title';
        let videoCss = '.plyr__video-embed__container iframe, .plyr__video-wrapper  iframe';
        let descCss = 'div.education-desc, div.tests-questions__name';
        await new Promise(resolve => {
            setTimeout(async function tick(){
                if($(descCss).length){
                    if($(videoCss).length === 0){
                        await new Promise(resolve => setTimeout(resolve,1000));
                    }
                    return resolve();
                }
                await new Promise(() => setTimeout(tick,500));
            }, 500);
        });
        let video = $(videoCss);
        lessonObj.url = window.location.href;
        lessonObj.title = $(titleCss)[0].innerText;
        lessonObj.description = $(descCss)[0].innerText;
        if(video.length !== 0){
            lessonObj.videoSrc =$(videoCss)[0].getAttribute('src').replace(/\?.*/,'');
        }
        lessonObj.initMaterials();
        await courseObj.next();
    }
}
courseObj = {
    title: null,
    description: null,
    url: null,
    imgSrc: null,
    lessons: [],
    initLessons: async function(){
        let lessonListCss = 'a.courses-dashboard_lesson-wrap';
        await new Promise(resolve => {
            setTimeout(async function tick(){
                if($(lessonListCss).length > 1){
                    return resolve();
                }
                await new Promise(() => setTimeout(tick,500));
            }, 500);
        });
        let lessonList = $(lessonListCss);
        if(courseObj.lessons.length < lessonList.length){
            lessonList[courseObj.lessons.length].click();
            await lessonObj.init()
        } else {
            courseObj.getCourseNavButton().click();
            await new Promise(resolve => setTimeout(resolve,3000));
            let descCss = '.courses-item__desc';
            let imgCss = '.image-seo-wrapper img';
            let courseIndex = treeObj.courses.length;
            courseObj.description = $(descCss)[courseIndex].innerText;
            courseObj.imgSrc = $(imgCss)[courseIndex].getAttribute('src');
            await treeObj.next();
        }
    },
    init: async function(){
        return new Promise(function(resolve){
            setTimeout(function(){
                courseObj.clean();
                let courseElem = $('.breadcrumbs li:nth-child(3) a');
                courseObj.title = courseElem[0].innerText;
                courseObj.url = window.location.href;
                courseObj.initLessons();
                resolve();
            }, 3000);
        })
    },
    clean: function(){
        courseObj.title = null;
        courseObj.url = null;
        courseObj.description = null;
        courseObj.imgSrc = null;
        courseObj.lessons = [];
    },
    getCourseNavButton: function(){
        let courseCss = '.breadcrumbs li:nth-child(2) a, .test-header__close a';
        return $(courseCss)[0];
    },
    next: async function(){
        courseObj.lessons.push(Object.assign({}, lessonObj));
        let courseElem = courseObj.getCourseNavButton();
        courseElem.click();
        await courseObj.initLessons();
    }
}
treeObj = {
    courses: [],
    isInit: function(){
        return Boolean(treeObj.courses.length);
    },
    initCourses: async function(){
        await new Promise(resolve => setTimeout(resolve,3000));
        let courseListCss = 'a.courses-item__img';
        let courseList = $(courseListCss);
        if(treeObj.courses.length < courseList.length){
            courseList[treeObj.courses.length].click();
            await new Promise(resolve => setTimeout(resolve,3000));
            await courseObj.init()
        } else {
            treeObj.unload();
        }
    },
    init: async function(){
        let startPage = '/uk/courses';
        if(window.location.pathname.includes(pageObj.loginPage.replace(/\/uk/, ''))
        || window.location.pathname.includes(pageObj.startPage.replace(/\/uk/, ''))){
            return Promise.reject(new Error('Перед стягуванням курсів, користувач має увійти під своїм логіном!'));
        }
        if(!window.location.pathname.includes(startPage.replace(/\/uk/, '')
            && !treeObj.isInit())){
            window.location.href = window.location.origin + startPage;
            return Promise.reject(new Error('Go to the start page...'));
        }
        await treeObj.initCourses();
    },
    next: async function(){
        treeObj.courses.push(Object.assign({}, courseObj));
        await treeObj.initCourses();
    },
    run: async function(){
        await treeObj.init();
    },
    unload: function(){
        fileObj.write(treeObj.getJsonData());
    },
    getJsonData: function(){
        return JSON.stringify(treeObj);
    }
}
fileObj = {
    name: "edu.genius.space.json",
    write: function(data){
        document.write(
            '<a href="data:text/plain;charset=utf-8,'
            + encodeURIComponent(data)
            + '" download="'
            + fileObj.name
            + '">' + fileObj.name + '</a>'
        )
    }
}
pageObj = {
    coursesObj: null,
    loginPage: '/uk/login',
    startPage: '/uk/login',//'/uk/free',
    searchStr: '',
    init: async ()=>{
        if(!window.location.pathname.includes(pageObj.startPage.replace(/\/uk/, ''))
        && !window.location.pathname.includes(pageObj.loginPage.replace(/\/uk/, ''))){
            return Promise.reject(new Error('Функціонал перегляду курсів можливий тільки при виході з аккаунту!'));
        }
        if(!window.location.pathname.includes(pageObj.startPage.replace(/\/uk/, ''))){
            window.location.href = window.location.origin + pageObj.startPage;
            return Promise.reject(new Error('Go to the start page...'));
        }
        if(typeof localStorage.coursesObj === 'undefined'){
            let json = await pageObj.getCoursesJson();
            localStorage.coursesObj = JSON.stringify(json);
        }
        pageObj.coursesObj = JSON.parse(localStorage.coursesObj);
        await pageObj.setNewHtml().then(console.log);
        // Initialize the tree with the example JSON data
        pageObj.buildTree($("#jsonTree"), pageObj.coursesObj);
    },
    refreshTree: (json) => {
        let obj = (!json) ? pageObj.coursesObj : JSON.parse(json);
        $("#jsonTree").empty();
        pageObj.buildTree($("#jsonTree"), obj);
    },
    setNewHtml: async function(){
        let fileUrl = 'https://raw.githubusercontent.com/RobertDafny/genius.courses/main/index.html';
        try{
            let htmlTxt = await fetch(fileUrl).then(response => response.text());
            document.write(htmlTxt);
        } catch(e){
            return Promise.reject(new Error('Помилка при отриманні файлу index.html'));
        }
    },
    grabberRun: async function(){
        await treeObj.run();
    },
    getCoursesJson: async function(){
        let filePath = 'https://raw.githubusercontent.com/RobertDafny/genius.courses/main/courses-2023-all.json';
        return await fetch(filePath)
            .then(response=>response.json())
            .catch(() => Promise.reject(new Error('Помилка при отриманні файлу курсів')));
    },
    getIframe: function(src){
        return !src ? '' : '<iframe src="'+ src +'?rel=0" allowfullscreen></iframe>';
    },
    replaceText: text => {
        return text.replace(/^\s+/, '')
            .replace(/\s+$/, '')
            .replace(/\n{3,}/g, "\n\n")
    },
    markActiveButtonWithParents: elem => {
        $('li button.active').removeClass('active')
        let mark = (e) => {
            e.addClass("active");
            var parent = e.closest('ul').closest('li').find('>button');
            if (parent.length) {
                mark(parent);
            }
        };
        mark(elem);
    },
    getActiveClass: obj => {
        return Boolean(localStorage.lastLessonId) && localStorage.lastLessonId.includes(obj.id)
            ? "active"
            : "";
    },
    // Function to recursively build the tree
    buildTree: function(parent, data){
        let propListName;
        let id;
        switch (true) {
            case data.directions && data.directions.length > 0:
                propListName = 'directions';
                data.id = 'root';
                break;
            case data.courses && data.courses.length > 0:
                propListName = 'courses';
                break;
            default:
                propListName = 'lessons';
        }

        let isRoot = !data.title;
        let searchSpan = '<span class=\\"highlight\\">';
        let jsonData = JSON.stringify(data);
        let isSearchFound = jsonData.includes(searchSpan);
        let isListHidden = !isRoot
            && (!pageObj.searchStr.length
                || pageObj.searchStr.length
                && !isSearchFound);

        let isButtonHidden = propListName === 'lessons'
            && pageObj.searchStr.length
            && !isSearchFound;

        let li = $("<li>").addClass("visible");
        let button = $(`<button id="${data.id}">`).html(isRoot ? 'Курси' : data.title);
        button.addClass(pageObj.getActiveClass(data));
        li.append(button);

        if (data[propListName] && data[propListName].length > 0) {
            let ul = isListHidden ? $("<ul>").hide() : $("<ul>"); // Initially hide child elements
            data[propListName].forEach(function (node, i) {
                node.id = data.id + i + 'e';
                pageObj.buildTree(ul, node);
            });
            li.append(ul);
            // Toggle visibility with animation on click
            button.click(function () {
                ul.slideToggle(500);
                pageObj.updateContent(data); // Update content on tree node click
            });
        } else {
            button.click(function () {
                pageObj.updateContent(data); // Update content on tree node click
                pageObj.markActiveButtonWithParents($(this));
                localStorage.lastLessonId = data.id;
            });
        }
        if(isButtonHidden){
            li.hide();
        }
        parent.append(li);
    },
    // Function to update content based on selected node
    updateContent: function(data) {
        if (data.materials) {
            // If it's a lesson node
            $("#courseInfo").hide();
            $("#lectureInfo").fadeIn(500);

            // Update lecture content
            var lesson = data; // For simplicity, consider the first lesson
            let videoElem = $("#videoSrc");
            if(lesson.videoSrc){
                videoElem.html(pageObj.getIframe(lesson.videoSrc));
                videoElem.show();
            } else {
                videoElem.hide();
            }
            $("#lectureTitle").html(pageObj.replaceText(lesson.title));
            $("#lectureDescriptionText").html(pageObj.replaceText(lesson.description));
            // Update additional materials list
            var materialsList = $("#materialsList");
            materialsList.empty(); // Clear previous materials
            let initMaterials = () => {
                lesson.materials.forEach(function (material) {
                    var listItem = $("<li>").html(material.title + ": ");
                    var materialLink = $("<a>")
                        .attr("href", material.fileSrc)
                        .attr("target", "_blank")
                        .text("Download")
                        .appendTo(listItem);
                    materialsList.append(listItem);
                });
                $('#lectureMaterials').show();
            };
            (!lesson.materials || lesson.materials.length == 0)
                ? $('#lectureMaterials').hide()
                : initMaterials();

        } else if (data.lessons && data.lessons.length > 0) {
            // If it's a course node
            $("#lectureInfo").hide();
            $("#courseInfo").fadeIn(500);

            // Update course content
            var course = data; // For simplicity, consider the first course
            $("#courseImage").attr("src", course.imgSrc);
            $("#courseTitle").html(pageObj.replaceText(course.title));
            $("#courseDescription").html(pageObj.replaceText(course.description));
        }
    },
    registerListeners: function(){
        // Обробник події для кнопки пошуку
        $("#searchButton").click(function () {
            var searchTerm = $("#searchInput").val().trim().toLowerCase();
            pageObj.hideAllNodes();
            pageObj.search(searchTerm);
        });

        // Обробник події для кнопки очищення тексту
        $("#clearButton").click(function () {
            $("#searchInput").val('');
            pageObj.clearSearch();
        });

        // Обробник події для комбінації гарячих клавіш Ctrl+F
        $(document).keydown(function (e) {
            if (e.ctrlKey && e.keyCode === 70) {
                // Відобразити елемент пошуку
                $("#searchContainer").show();
                $("#searchInput").focus();
                e.preventDefault();
            }
        });

        // Обробник події для клавіші Esc
        $(document).keyup(function (e) {
            if (e.keyCode === 27) {
                // Сховати елемент пошуку
                $("#searchContainer").hide();
            }
        });

        // Обробник події для клавіші Enter
        $(document).keyup(function (e) {
            if (e.keyCode === 13) {
                $("#searchButton").click();
            }
        });
    },
    hideAllNodes: function() {
        // Сховати всі елементи дерева
        $('#jsonTree>li>ul>li ul,#courseInfo,#lectureInfo').hide()
    },
    search: function(term){
        term = term.replace(/["]/g, '\\\\"');
        let regSearch = new RegExp(`(?<=(?:title|description)[":\s]{3,5})([^"]*)(${term})`,`gi`);
        let regReplace = `$1<span class=\\"highlight\\">$2</span>`;
        let json = localStorage.coursesObj.replace(regSearch, regReplace);
        pageObj.searchStr = term;
        pageObj.refreshTree(json);
    },
    clearSearch: function() {
        // Сховати всі елементи дерева
        pageObj.searchStr = '';
        pageObj.hideAllNodes();
        pageObj.refreshTree();
    }
}
