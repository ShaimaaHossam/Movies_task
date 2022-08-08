class Mediator {
    constructor(){
        this.events = {
        }
    }

    on(eventName, callback){
        this.events[eventName] = this.events[eventName] || []
        this.events[eventName].push(callback)
    }

    emit(eventName, data){
        if (this.events[eventName]) {
            this.events[eventName].forEach(function (callback) {
                callback(data)
            })
        }
    }

    
}
const mediator = new Mediator()
class Pages {
    constructor(){
        this.page = 1;
        mediator.on("pageCount", (data)=>{
            this.page_count = data.page_count
        })
    }
    getPage(){
        return this.page
    }
    setPage(page){
        this.page = page
    }
    getPageCount(){
        return this.page_count
    }
}
const page = new Pages()
class Modal{
    constructor(){
     this.API_KEY = "01fc404437ffcbaf607d106167a15136"
     mediator.on("renderModal", this.fetchMovieById.bind(this))

    }
    async fetchMovieById(movie_id){
        await axios.get("https://api.themoviedb.org/3/movie/"+movie_id.id+"?api_key="+this.API_KEY+"&language=en-US")
        .then(response => {
            this.render(response.data)
        })
        .catch(err=>console.log(err))
    }
    render(data){
        console.log(data)
        const template = `
        {{#movie}}
        <div class="row h-100 text-center text-md-start">
        <img id="modal-img" class="col-md-6 h-100" src="https://image.tmdb.org/t/p/w185{{poster_path}}" />
        <div class=" col-md-6 p-3">
            <p id="modal-title" class="header-color text-uppercase modal-title">{{original_title}}</p>
            <p id="modal-title" class="header-color text-uppercase modal-title">IMDB Rating: {{vote_average}} /10 ({{vote_count}} votes)</p>

            <p id="modal-body" class="mt-2">{{overview}}</p>
        </div>     
    </div>
    {{/movie}}
        `
        const $container = $("#modal")
        const rendered = Mustache.render(template, {"movie": data})
        $container.html(rendered)
    }
}
const modal = new Modal();
class Movies {
    constructor(){
        this.API_KEY = "01fc404437ffcbaf607d106167a15136"
        this.fetchData = this.fetchData.bind(this)
        mediator.on("PageChanged", (data)=> this.fetchData(data))
    }

    async fetchData(data){
       await axios.get("https://api.themoviedb.org/3/movie/popular?api_key="+this.API_KEY+"&language=en-US&page="+data.page)
                    .then(response => {
                        this.render(response.data); 
                        mediator.emit("pageCount", {
                            data: response.data, 
                            topR: this.getTopRatedMovie(response.data.results).title, 
                            rating: this.getTopRatedMovie(response.data.results).rating,
                            page_count: response.data.total_pages
                        })
                    })
                    .catch(err=>console.log(err))
    }
    getTopRatedMovie(movies){
        let max = 0;
        for(let i=0; i<movies.length;i++){
            if(movies[i].vote_average > movies[max].vote_average)
                max = i
        }
        return {title: movies[max].original_title, rating: movies[max].vote_average};
            
    }
    render(data){  
        console.log(data)
        var template = `{{#movies}}
        <div  class="col-md-3 item">
        <a id="{{id}}" href="#modal" rel="modal:open">
            <img src="https://image.tmdb.org/t/p/w185{{poster_path}}" />
            <p class="m-0">{{original_title}}</p>
            <p>{{vote_average}}</p>
            </a>
        </div>
        {{/movies}}`

        var $container = $("#movies_container")
        var rendered = Mustache.render(template, {"movies": data.results})
        $container.html(rendered)
        this.initializeEventListener()
    }
    initializeEventListener(){
        $("a").on("click", function(e){
            mediator.emit("renderModal", {id: this.id})
        })
    }
    
    
}
const movies = new Movies()

class Stats{
    constructor(){
        this.render = this.render.bind(this)
        mediator.on("pageCount", (data)=>this.render(data))
    }
    render(data){
        const template = `
        {{#page}}
        <p>Current Page: {{page}}</p>
        {{/page}}
        <p>Number of movies: {{movies_count}}</p>
        {{#topR}}
        <p>Top rated movie: {{.}}</p>
        {{/topR}}
        {{#rating}}
        <p>Rating: {{rating}}</p>
        {{/rating}}
        `
        
        const $container = $("#stats_info")
        const rendered = Mustache.render(template, {"page": data.data.page ,"movies_count": data.data.results.length, "topR":data.topR, "rating": data.rating})
        $container.html(rendered)
    }
}
const stat = new Stats()
$("#prev").on("click", ()=>{
    let curr = page.getPage()
    if(curr <= 1){
        page.setPage(curr)
    }
    else
        page.setPage(curr-1)

    mediator.emit("PageChanged", {page: page.getPage()})
})



$("#next").on("click", ()=>{
    const curr = page.getPage()
    if(curr >= 500)
        page.setPage(500)
    else
        page.setPage(page.getPage()+1)
    mediator.emit("PageChanged", {page: page.getPage()})
})



mediator.emit("PageChanged", {page: 1})
