;$(function(){                  // document ready, https://stackoverflow.com/a/4584475/21113444

    let blurred_id, period_of_day_class;                                                    // these variables will store values important to
    let recent_onclick = {"text": "" , "id": "", 'timestamp' : 0};                          // control the user's interaction with the page's
    let older_onclick = {"text": "" , "id": "", 'timestamp' : 0};                           // elements (especially clicks) and the time
    let recent_task, older_task, recent_project, older_project, dayObj_today, new_date, local_hour, UTC_hour, now_y, now_m, now_d, now_yyyymmdd, A_day_key, is_it_today, added_note_arr;
    let context_menu_tasks_clicks = 0;
    let context_menu_project_clicks = 0;
    const tmz_suffix = $("#tmz_suffix").html();
    const window_width = window.innerWidth;
    
    // Greets the user depending on the time of the day ("Good morning/afternoon/evening/night"), by using the Date object and timestamps.
    function greeting() {
        dayObj_today = new Date();
        let today_timestamp = dayObj_today.getTime();
        let dayObj_tomorrow = new Date(today_timestamp + 86400000);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let currentDay = dayObj_today.toLocaleDateString('en-US', options);
        let tomorrowDay = dayObj_tomorrow.toLocaleDateString('en-US', options);
        local_hour = parseInt(dayObj_today.toString().slice(16,18));                      // <-- assigns the hour of the day (local time)
        console.log('local_hour is:', local_hour);

        now_y = dayObj_today.getFullYear().toString();
        now_m = (dayObj_today.getMonth()+1).toString();
        now_d = (dayObj_today.getDate()).toString();
        if (now_m.length == 1){ now_m = "0" + now_m };
        if (now_d.length == 1){ now_d = "0" + now_d };
        now_yyyymmdd = now_y+'-'+now_m+'-'+now_d;

        if(local_hour > 3 && local_hour < 17){

            period_of_day_class = '.daytime';
            if (local_hour < 12){
                $("#period_of_day").html("morning");
                $("#period_of_day").css("background-image", "url(../img/morning.jpg)");     // the background image for the word "morning"
            } else{                                                                        // or "afternoon" etc also changes
                $("#period_of_day").html("afternoon");
                $("#period_of_day").css("background-image", "url(../img/afternoon.jpg)");
            }
            if ($('#day1 h5').html() == currentDay){
                $("#day1 .new_note").attr('placeholder', 'new note for today');
                $("#day2 .new_note").attr('placeholder', 'new note for tomorrow')
            } else if ($('#day1 h5').html() == tomorrowDay){
                $("#day1 .new_note").attr('placeholder', 'new note for tomorrow');
            }
            $(".ngttime").hide();
            $(".daytime").show();
            
        } else{
            period_of_day_class = '.ngttime';
            if (local_hour < 20){
                $("#period_of_day").html("evening");
                $("#period_of_day").css("background-image", "url(../img/evening.jpg)");
            } else{
                $("#period_of_day").html("night");
                $("#period_of_day").css("background-image", "url(../img/night.jpg)");
            }
            if ($('#day1 .ngttime h5').html() == tomorrowDay){
                $("#day1 .new_note").attr('placeholder', 'new note for tomorrow');
            }
            $(".daytime").hide();
            $(".ngttime").show();
        };
        A_day_key = $(".hidden_date"+period_of_day_class).html();
        is_it_today = Date.now() - new Date(A_day_key+tmz_suffix).getTime()
        if (is_it_today < 86400000 && is_it_today > 0 ){
            is_it_today = true;
            $("#day1").css('background-color', 'rgba(0,0,0,0.73)')
        };
    };
    greeting();
    added_note_arr = $('.added_note'+period_of_day_class);
    
    // Customize note's opacity for better visuals
    $(".new_note").parent().css("opacity", "0.3");
    $('.new_note').on('mousedown', function() {
        $(this).parent().css("opacity", "0.9");
    });

    // Impedes manipuation of potentially dangerous characters
    function sanitizeTextInput(in_str) {
        if(typeof(in_str) != "string"){ return false }
        let out_str = "", valid_char = false;
        for (let i = 0; i < in_str.length; i++) {
            if (in_str[i] == "{" || in_str[i] == "}" || in_str[i] == "`" ||
                in_str[i] == "<" || in_str[i] == ">" || in_str[i] == ";" ) { return false }
            else if (valid_char){
                if      (in_str[i] == " " && in_str[i+1] && in_str[i+1] != " ") { out_str += " " }
                else if (in_str[i] == '"'){ out_str += "'" }
                else { out_str += in_str[i] }
            } else if (in_str[i] != " "){ 
                out_str += in_str[i];
                valid_char = true
            }            
        };
        return out_str
    };

    function inputChecker(in_str, space_exception = false){
        if (in_str.length > 1 && in_str.length < 40){
            if (space_exception){
                for (let i = 0; i < in_str.length; i++) {
                    let code = in_str.charCodeAt(i);
                    if ( code < 32 || code == 34 || code == 39 || code == 40 || code == 41 || code == 47 || code == 123 || code == 125 ) {
                        return false;
                    }
                }
                return true
            } else{
                for (let i = 0; i < in_str.length; i++) {
                    let code = in_str.charCodeAt(i);
                    if ( code < 33 || code == 34 || code == 39 || code == 40 || code == 41 || code == 47 || code == 123 || code == 125 ) {
                        return false;
                    }
                }
                return true
            }
        }
        return false
    };

    function phoneChecker(in_str){
        if (in_str.length > 4 && in_str.length < 21){
            for (let i = 0; i < in_str.length; i++) {
                let code = in_str.charCodeAt(i);
                if ( (code > 47 && code < 58) || code == 43 || code == 40 || code == 41 || code == 45 || code == 32 ) {}
                else return false
            };
            return true
        };
        return false
    };

    // Lyuben Todorov https://stackoverflow.com/a/15465612/21113444
    function submitNewNote(day_number, in_text, in_fut_date = false){
        let checker = sanitizeTextInput(in_text);
        if(checker){
            let key_to_add;
            if (day_number == 1){ key_to_add = A_day_key }
            else                { key_to_add = $(".hidden_date"+period_of_day_class).last().html() };
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){ in_fut_date = true };
            let string_to_submit = JSON.stringify([key_to_add, checker, in_fut_date, A_day_key]);
            let param = "<input hidden type='text' name='new_note_arr' value='" + string_to_submit + "'/>";
            $("#form-day" + day_number).append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-day" + day_number).append(param_hour);
            document.getElementById("form-day" + day_number).submit();                
        } else{
            alert("Sorry, note cannot contain '{', '}', '<', '>' or non-printables")
        }
    };
    
    function submitEdittedNote(day_number, in_timestamp, in_text){
        let checker = sanitizeTextInput(in_text);
        if(checker){
            let key_to_edit;
            if (day_number == 1){ key_to_edit = A_day_key }
            else                { key_to_edit = $(".hidden_date"+period_of_day_class).last().html() };
            let string_to_submit;
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                string_to_submit = JSON.stringify([key_to_edit, checker, in_timestamp, true, A_day_key])
            }else{
                string_to_submit = JSON.stringify([key_to_edit, checker, in_timestamp, false, A_day_key])
            };
            let param = "<input hidden type='text' name='edit_note_arr' value='" + string_to_submit + "'/>";
            $("#form-day" + day_number).append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-day" + day_number).append(param_hour);
            document.getElementById("form-day" + day_number).submit();                
        } else{
            alert("Sorry, note cannot contain '{', '}', '<', '>'")
        }
    };
    
    function submitEdittedRoutineNote(in_key, in_timestamp, in_new_text, in_old_text, in_class){
        let checker = sanitizeTextInput(in_new_text);
        if(checker){
            let string_to_submit;
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                string_to_submit = JSON.stringify([in_key, checker, in_old_text, in_timestamp, in_class, true, A_day_key])
            }else{
                string_to_submit = JSON.stringify([in_key, checker, in_old_text, in_timestamp, in_class, false])
            };
            let param = "<input hidden type='text' name='edit_routine_note' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();                
        } else{
            alert("Sorry, note cannot contain '{', '}', '<', '>'")
        }
    };
    
    function removeNote(day_number, in_timestamp, in_fut_date = false){
        let key_to_remove_from;
        if (day_number == 1){ key_to_remove_from = A_day_key }
        else                { key_to_remove_from = $(".hidden_date"+period_of_day_class).last().html() };
        if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){ in_fut_date = true };
        let string_to_submit = JSON.stringify([key_to_remove_from, in_timestamp, in_fut_date, A_day_key]);
        let param = "<input hidden type='text' name='remove_note_arr' value='" + string_to_submit + "'/>";
        $("#form-day" + day_number).append(param);
        new_date = new Date();
        local_hour = new_date.getHours();
        UTC_hour = new_date.getUTCHours();
        let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
        let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
        $("#form-day" + day_number).append(param_hour);
        document.getElementById("form-day" + day_number).submit();
    };
    
    function evaluateBlurredNote(in_id, in_timestamp, in_text, in_key = false, in_parent_class = false) {
        let element_day_number = in_id.slice(14,15);
        if (in_key){
            if(in_text == ""){ removeRoutineNote(element_day_number, in_timestamp) }
            else if (in_id == recent_onclick.id && in_text != recent_onclick.text){
                if (in_text.length < 81){ submitEdittedRoutineNote(in_key, in_timestamp, in_text, recent_onclick.text, in_parent_class) }
                else{ alert("Sorry, note is limited to 80 characters") }
            }            
        } else{
            if(in_text == ""){ removeNote(element_day_number, in_timestamp) }
            else if (in_id == recent_onclick.id && in_text != recent_onclick.text){
                if (in_text.length < 81){ submitEdittedNote(element_day_number, in_timestamp, in_text) }
                else{ alert("Sorry, note is limited to 80 characters") }
            }
        }
    };
    
    function applyRoutines(routines_raw){
        const routines_parsed = JSON.parse(routines_raw);     // <-- originally, it was JSON.parse(JSON.parse(routines_raw))
        const dayA_key = $($(".hidden_date"+period_of_day_class)[0]).html();
        const dayB_key = $($(".hidden_date"+period_of_day_class).last()).html();
        const dayobj_A = new Date(dayA_key);
        const dayobj_B = new Date(dayB_key);

        if (routines_parsed['highlight']){
            let dayA_high_arr, dayB_high_arr;
            if(routines_parsed['highlight'][dayA_key]){ dayA_high_arr = routines_parsed['highlight'][dayA_key] };
            if(routines_parsed['highlight'][dayB_key]){ dayB_high_arr = routines_parsed['highlight'][dayB_key] };
            if (dayA_high_arr){
                for (let j = 0; j < dayA_high_arr.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        if ( dayA_high_arr[j][1] == $($(added_note_arr)[k]).siblings('.note_timestamp').html() ){
                            $($(added_note_arr)[k]).siblings('.header__bg').addClass('highlight');
                        }
                    }
                }
            };
            if (dayB_high_arr){
                for (let j = 0; j < dayB_high_arr.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        if ( dayB_high_arr[j][1] == $($(added_note_arr)[k]).siblings('.note_timestamp').html() ){
                            $($(added_note_arr)[k]).siblings('.header__bg').addClass('highlight');
                        }                    
                    }
                }
            }
        };

        if(routines_parsed['weekly']){
            const weekday_A = dayobj_A.getUTCDay();
            const weekday_B = dayobj_B.getUTCDay();
            let weekly_arr_A, weekly_arr_B;
            if(routines_parsed['weekly'][weekday_A]){ weekly_arr_A = routines_parsed['weekly'][weekday_A] };
            if(routines_parsed['weekly'][weekday_B]){ weekly_arr_B = routines_parsed['weekly'][weekday_B] };
            let create_new = true;
            if (weekly_arr_A){
                for (let j = 0; j < weekly_arr_A.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        let this_note = added_note_arr[k];
                        if ( weekly_arr_A[j] == $(this_note).html() ){
                            $($(this_note).parent()).addClass('weekly');
                            $(added_note_arr[k]).addClass('weekly');
                            create_new = false;
                            if ($(this_note).hasClass('monthly') && !$(this_note).hasClass('bothstamps')){
                                $($(this_note).parent()).addClass('bothstamps');
                                $(this_note).addClass('bothstamps');
                            }
                        }
                    }
                    if (create_new && $("#mili_diff").html() > 0){
                        submitNewNote(1, weekly_arr_A[j], true)
                    }
                }
            };
            create_new = true;
            if (weekly_arr_B){
                for (let j = 0; j < weekly_arr_B.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        let this_note = added_note_arr[k];
                        if ( weekly_arr_B[j] == $(this_note).html() ){
                            $($(this_note).parent()).addClass('weekly');
                            $(added_note_arr[k]).addClass('weekly');
                            create_new = false;
                            if ($(this_note).hasClass('monthly') && !$(this_note).hasClass('bothstamps')){
                                $($(this_note).parent()).addClass('bothstamps');
                                $(this_note).addClass('bothstamps');
                            }
                        }
                    }
                    if (create_new && $("#mili_diff").html() > 0){
                        submitNewNote(2, weekly_arr_B[j], true)
                    }
                }
            }
        };

        if(routines_parsed['monthly']){
            let monthly_rtn = routines_parsed['monthly'];
            let day_A = dayobj_A.getUTCDate();
            let day_B = dayobj_B.getUTCDate();
            let monthly_arr_A, monthly_arr_B;
            if(monthly_rtn[day_A]){ monthly_arr_A = monthly_rtn[day_A] };
            if(monthly_rtn[day_B]){ monthly_arr_B = monthly_rtn[day_B] };
            let create_new = true;
            if (monthly_arr_A){
                for (let j = 0; j < monthly_arr_A.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        let this_note = added_note_arr[k];
                        if ( monthly_arr_A[j] == $(this_note).html() ){
                            $($(this_note).parent()).addClass('monthly');
                            $(added_note_arr[k]).addClass('monthly');
                            create_new = false
                            if ($(this_note).hasClass('weekly') && !$(this_note).hasClass('bothstamps')){
                                $($(this_note).parent()).addClass('bothstamps');
                                $(this_note).addClass('bothstamps');
                            }
                        }
                    }
                    if (create_new && $("#mili_diff").html() > 0){
                        submitNewNote(1, monthly_arr_A[j], true)
                    }
                }
            }
            create_new = true;
            if (monthly_arr_B){
                for (let j = 0; j < monthly_arr_B.length; j++){
                    for (let k = 0; k < added_note_arr.length; k++){
                        let this_note = added_note_arr[k];
                        if ( monthly_arr_B[j] == $(this_note).html() ){
                            $($(this_note).parent()).addClass('monthly');
                            $(added_note_arr[k]).addClass('monthly');
                            create_new = false;
                            if ($(this_note).hasClass('weekly') && !$(this_note).hasClass('bothstamps')){
                                $($(this_note).parent()).addClass('bothstamps');
                                $(this_note).addClass('bothstamps');
                            }
                        }
                    }
                    if (create_new && $("#mili_diff").html() > 0){
                        submitNewNote(2, monthly_arr_B[j], true)
                    }
                }
            };
            let big_routine_day = [];
            let this_month;
            let this_month_last_day = 0;
            if (monthly_rtn['31'] && monthly_rtn['31'].length){ big_routine_day.push(31) };
            if (monthly_rtn['30'] && monthly_rtn['30'].length){ big_routine_day.push(30) };
            if (monthly_rtn['29'] && monthly_rtn['29'].length){ big_routine_day.push(29) };
            if(big_routine_day.length){
                if (day_B > 27){
                    this_month = dayobj_B.getUTCMonth();
                    this_month_last_day = day_B;
                    let plus1 = new Date(dayobj_B.getTime()+86400000);
                    let plus1_month = plus1.getUTCMonth();
                    while (this_month == plus1_month){
                        this_month_last_day = plus1.getUTCDate();
                        plus1 = new Date(plus1.getTime()+86400000);
                        plus1_month = plus1.getUTCMonth()
                    }
                } else if(day_B == 1){
                    this_month = dayobj_A.getUTCMonth();
                    this_month_last_day = day_A;
                    let plus1 = new Date(dayobj_A.getTime()+86400000);
                    let plus1_month = plus1.getUTCMonth();
                    while (this_month == plus1_month){
                        this_month_last_day = plus1.getUTCDate();
                        plus1 = new Date(plus1.getTime()+86400000);
                        plus1_month = plus1.getUTCMonth()
                    }    
                }
            };
            if(this_month_last_day){
                for (let a = big_routine_day.length-1; a > -1; a--){
                    let q = big_routine_day[a]
                    if(big_routine_day[a] > this_month_last_day){
                        for (let c = 0; c < monthly_rtn[q].length; c++){
                            let already_added = false;
                            for(let b = 0; b < added_note_arr.length; b++){
                                if ($(added_note_arr[b]).html() == monthly_rtn[q][c]){
                                    already_added = true;
                                    if($(added_note_arr[b]).hasClass('monthly') || $(added_note_arr[b]).hasClass('bothstamps')){ break }
                                    else if($(added_note_arr[b]).hasClass('weekly')){
                                        $(added_note_arr[b]).addClass('bothstamps');
                                        $($(added_note_arr[b]).parent()).addClass('bothstamps');
                                        break
                                    } else{
                                        $(added_note_arr[b]).addClass('monthly');
                                        $($(added_note_arr[b]).parent()).addClass('monthly');
                                        break
                                    }
                                };
                            };
                            if (!already_added){
                                if (day_B >= day_A){ submitNewNote(2, monthly_rtn[q][c], true) }
                                else{ submitNewNote(1, monthly_rtn[q][c], true) }
                            }
                        }
                    }
                }
            }
        }
    };
    applyRoutines($("#routines_raw").html());
    
    // sends the blurred note to evaluateBlurredNote, if context_menu is hidden
    $('.added_note').on('blur',function(){
        blurred_id = this.id;
        let note_timestamp = $(this).siblings('.note_timestamp').html();
        let blurred_text = $(this).val();
        let checker = false;
        if ( $("#context_note").css('visibility') == 'hidden' ){
            let parent_class = $($(this).parent()[0]).attr('class');
            try{
                if (parent_class == 'weekly' || parent_class == 'monthly' || parent_class.slice(-10,) == 'bothstamps'){
                    let key_to_routine = $(this).parents('.row-days').find('.hidden_date'+period_of_day_class).html();
                    evaluateBlurredNote(blurred_id, note_timestamp, blurred_text, key_to_routine, parent_class);
                    checker = true;
                    return
                } else{
                    evaluateBlurredNote(blurred_id, note_timestamp, blurred_text);
                    checker = true;
                    return
                }
            } catch{
                if (!checker){
                    evaluateBlurredNote(blurred_id, note_timestamp, blurred_text);
                    return
                }
            }
        }
    });

    // sends new note to submitNewNote function, if 0 < length < 101
    $('.new_note').on('blur', function() {
        let inserted_text = $(this).val();
        if (inserted_text && inserted_text != ""){
            if (inserted_text.length < 81){
                let new_note_day_number = this.id.slice(-1);
                submitNewNote(new_note_day_number, inserted_text)
            } else{
                alert("Sorry, note is limited to 80 characters")
            }
        }
        $(this).parent().css("opacity", "0.3");
    });

    $('.added_note').on('click', function(e) {
        if(recent_onclick.text == ""){
            recent_onclick.text = this.innerHTML;
            recent_onclick.id = this.id;
            recent_onclick.timestamp = Date.now()
        } else{
            let older_text = recent_onclick.text;
            let older_id = recent_onclick.id;
            let older_timestamp = recent_onclick.timestamp;
            older_onclick.text = older_text;
            older_onclick.id = older_id;
            older_onclick.timestamp = older_timestamp;
            recent_onclick.text = this.innerHTML;
            recent_onclick.id = this.id;
            recent_onclick.timestamp = Date.now()
        }
    });

    function contextMenuAddedNote(in_event, in_obj){
        $(in_obj).blur();
        let pos = in_obj.getBoundingClientRect()
        let pos_x = pos.left, pos_y = pos.bottom;
        let context_menu_width = $(".context_menu.wrapper").width();
        if(pos_x > window_width - context_menu_width){
            pos_x = pos_x - context_menu_width;
        }
        $(".context_menu.wrapper").css('left', `${pos_x}px`);
        $(".context_menu.wrapper").css('top', `${pos_y}px`);
        $("#context_note").css('visibility', 'visible');

        if ($($(in_obj).siblings('.highlight')[0]).length > 0){
            $("#highlight_button").hide();
            $("#unhighlight_button").show();
        } else{
            $("#unhighlight_button").hide();
            $("#highlight_button").show();
        }
        if( $(in_obj).hasClass('weekly') ){
            $("#weekly_button").hide();
            $("#unweekly_button").show();
        } else{
            $("#unweekly_button").hide();
            $("#weekly_button").show();
        }

        if( $(in_obj).hasClass('monthly') ){
            $("#monthly_button").hide();
            $("#unmonthly_button").show();
        } else{
            $("#unmonthly_button").hide();
            $("#monthly_button").show();
        }

        let this_id = $(in_obj).attr('id');
        let blocker = false;
        $("body").on('contextmenu', function(event){
            if ( $(event.target).attr('id') != this_id ){
                blocker = true;
                return
            }
        });

        let note_timestamp = $(in_obj).siblings('.note_timestamp').html();
        let element_day_number = in_obj.id.slice(14,15);
        
        $('#remove_button, #remove_icon').on('click', function(){
            removeNote(element_day_number, note_timestamp);
        });
        
        let key_to_routine = $(in_obj).parents('.row-days').find('.hidden_date'+period_of_day_class).html();
        let note_text = $(in_obj).val();
        let arr_with_values = [key_to_routine, note_timestamp, note_text];

        $('#weekly_button, #weekly_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('weekly');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();                
        });
        $('#monthly_button, #monthly_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('monthly');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();                
        });
        $('#highlight_button, #highlight_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('highlight');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();                
        });
        $('#unweekly_button, #unweekly_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('unweekly');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit()
        });
        $('#unmonthly_button, #unmonthly_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('unmonthly');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();
        });
        $('#unhighlight_button, #unhighlight_icon').on('click', function(){
            if (blocker){ return };
            arr_with_values.push('unhighlight');
            if($(".hidden_date.day1.daytime").html() != now_yyyymmdd ){
                arr_with_values.push(true);
                arr_with_values.push(A_day_key)
            } else{ arr_with_values.push(false) };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='routine_note_arr' value='" + string_to_submit + "'/>";
            $("#form-routine").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-routine").append(param_hour);
            document.getElementById("form-routine").submit();                
        });
    };
    
    $('.added_note').on('contextmenu', function (event) {
        event.preventDefault();
        contextMenuAddedNote(event, event.target)
    });
    function touchTimeCounter(in_obj, in_event){
        let sender = true;
        in_obj.addEventListener('touchend',(ev)=>{ sender = false; $(in_obj).focus() });
        in_obj.addEventListener('touchmove',(ev)=>{ sender = false; $(in_obj).focus() });
        in_obj.addEventListener('touchcancel',(ev)=>{ sender = false; $(in_obj).focus() });
        setTimeout(() => {
            if (sender){ contextMenuAddedNote(in_event, in_obj) }
        }, 800)
    };
    let added_notes_arr = document.getElementsByClassName('added_note');
    for (let i = 0; i < added_notes_arr.length; i++){
        added_notes_arr[i].addEventListener('touchstart', (ev)=>{
            ev.preventDefault();
            touchTimeCounter(added_notes_arr[i], ev)
        })
        //added_notes_arr[i].addEventListener('touchstart', (ev)=>{ contextMenuAddedNote(ev) })
    };

    $( '.weekly.monthly' ).addClass('bothstamps');
    $( '.monthly.weekly' ).addClass('bothstamps');
    $( '.weekly .wk.stamp' ).css({'visibility' : 'visible', 'height' : 'fit-content', 'transform' : 'translateY(-15px)', 'z-index' : 1});
    $( '.monthly .mh.stamp' ).css({'visibility' : 'visible', 'height' : 'fit-content', 'transform' : 'translateY(-15px)', 'z-index' : 1});
    $( '.bothstamps .wk.stamp' ).css({'transform' : 'translateX(20px) translateY(-15px)'});

    $(window).on('scroll', function(){
        $( '.stamp' ).css({'transform' : `translateY(${-window.scrollY -15}px)`});
        $( '.bothstamps .wk.stamp' ).css({'transform' : `translateX(20px) translateY(${-window.scrollY -15}px)`});
    });

    $('#add_new_project').on('click', function(){
        $($('.shade_project_box')[0]).css('visibility', 'visible');
        $('#new_project_box').css({'top' : `${window.scrollY + (window.innerHeight/12)}px`});
        $('.another_task').hide();
        $('#more_tasks_can_be_added_later').hide();
        $('.spacer').hide();
        $('#another_task0').show();
        let add_ath_tsk_arr = $('.add_another_task');
        $(add_ath_tsk_arr[0]).html('+1');
        $('#new_project_box').css('visibility','visible');
        add_ath_tsk_arr.on('click', function(){
            if ($(this).html() == '+1'){ 
                for (let a = 0; a < 8; a++){
                    $(add_ath_tsk_arr[a]).html('remove');
                    if ($(add_ath_tsk_arr[a]).css('height') == '0px'){
                        $($('.another_task')[a]).show();
                        let hidden = false;
                        for (let y = 6; y > a; y--){
                            if ($(add_ath_tsk_arr[y]).css('height') == '0px'){
                                hidden = true;
                                break
                            }
                        }
                        for (let z = 7; z >= a; z--){
                            if ($(add_ath_tsk_arr[z]).css('height') != '0px'){
                                if (z ==7){                                    
                                    if (hidden){
                                        $(add_ath_tsk_arr[z]).html('+1')
                                    } else{
                                        $(add_ath_tsk_arr[z]).html('remove');
                                        $('#more_tasks_can_be_added_later').show();
                                        $('.spacer').show()
                                    }
                                    break
                                } else{
                                    $(add_ath_tsk_arr[z]).html('+1')
                                    break
                                }
                            }
                        }
                        break
                    }
                }
            } else{    //remove
                $($(this).parent()).hide();
                $('#more_tasks_can_be_added_later').hide();
                $('.spacer').hide();
                for (let a = 0; a < 7; a++){
                    $(add_ath_tsk_arr[a]).html('remove');
                }
                for (let b = 7; b > -1; b--){
                    if ($(add_ath_tsk_arr[b]).css('height') != '0px'){
                        $(add_ath_tsk_arr[b]).html('+1');
                        break
                    }
                }
            }
        });
        $('#cancel_new_project').on('click', function(){
            $('.shade_project_box').css('visibility', 'hidden');
            $('#new_project_box').css('visibility', 'hidden');
        })
    });
    $("#submit_new_project").on('mousedown', function(){
        $(this).css('background-color', 'rgb(22,3,30)')
    });

    function specificTaskContext(in_object, in_number) {
        const received_number = in_number;
        let observations = $(in_object).children('.obs-box')[0];
        let observations_measures = observations.getBoundingClientRect();
        let this_measures = in_object.getBoundingClientRect();
        let background_to_apply = $(in_object).css('background-color');
        let border_to_apply = $(in_object).css('border');
        $(observations).css('visibility', 'hidden');
        $('#context_task').css('visibility', 'hidden');
        $(observations).css('background-color', background_to_apply);
        $(observations).css('border', border_to_apply);
        $(observations).css('top',`${this_measures.top - observations_measures.height - 10 + window.scrollY}px`);
        $('#context_task').css('top',`${this_measures.bottom + window.scrollY}px`);
        $("#context_submit_task").css('left',151);
        
        if( this_measures.right + 130 > window.innerWidth){
            $('#context_task').css('left', `${this_measures.left + (this_measures.width - 151)}px`);
            if (this_measures.width < 130){ $(observations).css('right','10px') }
            else{ $(observations).css('right',`${this_measures.width - 130}px`) }            
        } else if (this_measures.left < 130){
            $('#context_task').css('left', `${this_measures.left}px`);
            if (this_measures.width < 130){ $(observations).css('left','10px') }
            else{ $(observations).css('left',`${this_measures.width - 130}px`) }
        } else{ $('#context_task').css('left', `${this_measures.left}px`) };

        if ($(in_object).hasClass('done')){
            $(observations).css('background-color','rgb(10,60,0)');
            $(observations).css('border','solid 2px rgb(30,200,10)');
        };
        $(observations).css('visibility', 'visible');
        $('#context_task').css('visibility', 'visible');

        if ( $(in_object).hasClass('done') ){
            $("#mark_done_button").hide();
            $("#mark_todo_button").show();
        } else{
            $("#mark_todo_button").hide();
            $("#mark_done_button").show();
        }
        if( $(in_object).children('.task-deadline')[0] ){
            $("#set_deadline_button").hide();
            $("#change_deadline_button").show();
        } else{
            $("#change_deadline_button").hide();
            $("#set_deadline_button").show();
        }

        $('#change_task_button').on('click', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            $("#context_submit_task").css('top', '0px');
            $(".context_task_text").css('visibility', 'hidden');
            $("#edit_task_text").css('visibility', 'visible');
            $("#edit_task_text").focus();
            $("#context_submit_task").css('visibility', 'visible');
        });
        $('#add_task_before').on('click', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            $("#context_submit_task").css('top', '38px');
            $(".context_task_text").css('visibility', 'hidden');
            $("#new_task_before").css('top', '38px');
            $("#new_task_before").css('visibility', 'visible');
            $("#new_task_before").focus();
            $("#context_submit_task").css('visibility', 'visible');
        });
        $('#add_task_after').on('click', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            $("#context_submit_task").css('top', '76px');
            $(".context_task_text").css('visibility', 'hidden');
            $("#new_task_after").css('top', '76px');
            $("#new_task_after").css('visibility', 'visible');
            $("#new_task_after").focus();
            $("#context_submit_task").css('visibility', 'visible');
        });
        $('#set_deadline_button, #change_deadline_button').on('click', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            $("#context_submit_task").css('top', '152px');
            $(".context_task_text").css('visibility', 'hidden');
            $("#new_task_deadline").css('top', '152px');
            $("#new_task_deadline").css('visibility', 'visible');
            $("#context_submit_task").css('visibility', 'visible');
        });

        let projects_arr = $('.tasks');
        let project_index;
        for (let d = 0; d < projects_arr.length; d++){
            if (received_number != context_menu_tasks_clicks){ return };
            if ( $(in_object).parents('.tasks')[0] == projects_arr[d] ){
                project_index = d;
                break
            }
        }
        let old_text = $($(in_object).children('.task-text')[0]).html();
        
        let arr_with_values = [project_index, old_text];
        if ($(in_object).hasClass('todo')){
            arr_with_values.push('todo')
        } else if ($(in_object).hasClass('done')){
            arr_with_values.push('done')
        };
        
        $('#context_submit_task').on('mousedown', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            let edit_task_text = $('#edit_task_text').val();
            let new_task_before = $('#new_task_before').val();
            let new_task_after = $('#new_task_after').val();
            if (    (edit_task_text == ""   || $(edit_task_text).length < 41    && sanitizeTextInput(edit_task_text)) &&
                    (new_task_before == ""  || $(new_task_before).length < 41   && sanitizeTextInput(new_task_before)) &&
                    (new_task_after == ""   || $(new_task_after).length < 41    && sanitizeTextInput(new_task_after))){
                arr_with_values.push(edit_task_text);
                arr_with_values.push(new_task_before);
                arr_with_values.push(new_task_after);
            } else{ alert('Sorry, project tasks are limited to 40 characters, but you can add observations to it') };
            arr_with_values.push($('#new_task_deadline').val());
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='project_task_arr' value='" + string_to_submit + "'/>";
            $("#form-project").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-project").append(param_hour);
            document.getElementById("form-project").submit();                
        });
        
        $('#mark_done_button, #mark_todo_button').on('mousedown', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='mark_done_todo' value='" + string_to_submit + "'/>";
            $("#form-project").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-project").append(param_hour);
            document.getElementById("form-project").submit();                
        });
        $('#remove_task_button').on('mousedown', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='remove_task_arr' value='" + string_to_submit + "'/>";
            $("#form-project").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-project").append(param_hour);
            document.getElementById("form-project").submit();                
        });

        let this_obs = $(in_object).find('.obs')[0];
        $($(in_object).find('.obs-save-button')).on('mousedown', function(){
            if (received_number != context_menu_tasks_clicks){ return };
            arr_with_values.push($(this_obs).val());
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='edit_obs_arr' value='" + string_to_submit + "'/>";
            $("#form-project").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);;
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-project").append(param_hour);
            document.getElementById("form-project").submit();                
        });
    };

    $('.specific_task').on('click', function(event){
        event.preventDefault();
        if (!older_task){
            if (!recent_task){
                recent_task = this;
                context_menu_tasks_clicks += 1;
                specificTaskContext(recent_task, context_menu_tasks_clicks)
            } else{
                older_task = recent_task;
                recent_task = this;
                context_menu_tasks_clicks += 1;
                specificTaskContext(recent_task, context_menu_tasks_clicks)
            }
        } else{
            older_task = recent_task;
            recent_task = this;
            context_menu_tasks_clicks += 1;
            specificTaskContext(recent_task, context_menu_tasks_clicks)
        }
    });

    function projectTitleContext(in_object, in_number, in_x, in_y) {

        if (in_x + 170 > window.innerWidth){
            $('#context_project-title').css('left', `${in_x - 150}px`);
            $("#context_submit_project").css('left', -39);
        } else{
            $('#context_project-title').css('left', `${in_x}px`)
            $("#context_submit_project").css('left', 151);
        }
        $('#context_project-title').css('top', `${in_y}px`);
        $("#context_submit_project").css('visibility', 'hidden');

        if ( $($(in_object).children('.final_deadline-box')[0]).html() == 'false' ){
            $("#set_project_deadline_button").show();
            $("#change_project_deadline_button").hide();
        } else{
            $("#set_project_deadline_button").hide();
            $("#change_project_deadline_button").show();
        };
        $('#context_project-title').css('visibility', 'visible');

        $('#set_project_deadline_button, #change_project_deadline_button').on('click', function(){
            if (in_number < context_menu_project_clicks){ return };
            $("#context_project_title").css('visibility', 'hidden');
            $("#context_submit_project").css('top', 0);
            $("#context_project_deadline").css('visibility', 'visible');
            $("#context_submit_project").css('visibility', 'visible');
        });
        $('#change_project_title_button').on('click', function(){
            if (in_number < context_menu_project_clicks){ return };
            $("#context_project_deadline").css('visibility', 'hidden');
            $("#context_project_title").css('top', '38px');
            $("#context_submit_project").css('top', '38px');
            $("#context_project_title").css('visibility', 'visible');
            $("#context_submit_project").css('visibility', 'visible');
        });
        $('#delete_project_button').on('click', function(){
            if (in_number < context_menu_project_clicks){ return };
            $($('.confirm_deletion_box')[0]).css({'top' : `${window.scrollY + (window.innerHeight/3)}px`});
            $($('.confirm_deletion_box')[0]).css({'left' : 0});
            $($('.shade_project_box')[1]).css('visibility', 'visible');
            $('#new_project_box').css('visibility', 'hidden');
            $('.confirm_deletion_box').css('visibility', 'visible');
        });
        
        let project_index;
        for (let d = 0; d < $('.project').length; d++){
            if ( $('.project')[d] == in_object ){
                project_index = d;
                break
            }
        };
        let arr_with_values = [project_index];
        
        $('#context_submit_project').on('mousedown', function(){
            let deadline_value = $('#context_project_deadline').val();
            let title_value = $('#context_project_title').val();
            if ( ( deadline_value || title_value ) && (deadline_value != '' || title_value != '')){
                arr_with_values.push(deadline_value);
                arr_with_values.push(title_value);
                let string_to_submit = JSON.stringify(arr_with_values);
                let param = "<input hidden type='text' name='project_title_and_deadline_arr' value='" + string_to_submit + "'/>";
                $("#form-project").append(param);
                new_date = new Date();
                local_hour = new_date.getHours();
                UTC_hour = new_date.getUTCHours();
                let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
                let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
                $("#form-project").append(param_hour);
                document.getElementById("form-project").submit();                
            }
        });
        $('#confirm_deletion_button').on('click', function(){
            
            let param = "<input hidden type='text' name='delete_project' value='" + project_index + "'/>";
            $("#form-project").append(param);
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-project").append(param_hour);
            document.getElementById("form-project").submit();                
        });
        $('#cancel_deletion_button').on('click', function(){
            $('.shade_project_box').css('visibility', 'hidden');
            $('.confirm_deletion_box').css('visibility', 'hidden')            
        });
    };

    $('.project_title, .final_deadline-box').on('click', function(event){
        event.preventDefault();
        let click_x = event.clientX, click_y = event.clientY + window.scrollY;
        if (!older_project){
            if (!recent_project){
                recent_project = $(this).parent()[0];
                context_menu_project_clicks += 1;
                projectTitleContext(recent_project, context_menu_project_clicks, click_x, click_y)
            } else{
                older_project = recent_project;
                recent_project = $(this).parent()[0];
                context_menu_project_clicks += 1;
                projectTitleContext(recent_project, context_menu_project_clicks, click_x, click_y)
            }
        } else{
            older_project = recent_project;
            recent_project = $(this).parent()[0];
            context_menu_project_clicks += 1;
            projectTitleContext(recent_project, context_menu_project_clicks, click_x, click_y)
        }
    });

    if ($("#celsius").html() == "true" || $("#celsius").html() == true){
        $("#show_c").hide();
        let temps = $(".weather_temperature");
        for (let t = 0; t < temps.length; t++){
            let buf_temp = $(temps[t]).html();
            $(temps[t]).html(buf_temp + "ºC")
        };

    } else{
        $("#show_f").hide();
        let temps = $(".weather_temperature");
        for (let t = 0; t < temps.length; t++){
            let buf_temp = $(temps[t]).html();
            $(temps[t]).html(buf_temp + "ºF")
        }
    };

    $('.weather_day').on('click', function(event){
        event.preventDefault();
        let pos_x = event.clientX, pos_y = event.clientY + window.scrollY;
        if(pos_x + 170 > window_width){ pos_x = pos_x - 150 };
        $("#context_weather").css('left', `${pos_x}px`);
        $("#context_weather").css('top', `${pos_y}px`);
        $("#context_weather").css('visibility', 'visible');

        $('#show_f').on('click', function(){
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            string_to_submit = JSON.stringify([local_hour, 0]);
            let param = "<input hidden type='text' name='temp_letter' value='" + string_to_submit + "'/>";
            $("#form-weather").append(param);
            document.getElementById("form-weather").submit();                
        });
        $('#show_c').on('click', function(){
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            string_to_submit = JSON.stringify([local_hour, 1]);
            let param = "<input hidden type='text' name='temp_letter' value='" + string_to_submit + "'/>";
            $("#form-weather").append(param);
            document.getElementById("form-weather").submit();                
        });
        $('#show_simpl').on('click', function(){
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            string_to_submit = JSON.stringify([local_hour, 's']);
            let param = "<input hidden type='text' name='temp_letter' value='" + string_to_submit + "'/>";
            $("#form-weather").append(param);
            document.getElementById("form-weather").submit();                
        });
        $('#show_compl').on('click', function(){
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            string_to_submit = JSON.stringify([local_hour, 'o']);
            let param = "<input hidden type='text' name='temp_letter' value='" + string_to_submit + "'/>";
            $("#form-weather").append(param);
            document.getElementById("form-weather").submit();                
        });
    });

    $( function() {
      $( "#datepicker" ).datepicker({ minDate: "-2Y", maxDate: "+4Y" });
    } );
    /* $("#datepicker").on('change', function(){
        $("#datepicker").val('📅');
    }); */

    $('body').on('mousedown', function(event){
        let event_class = $(event.target).attr('class');
        if (event_class){
            if (event_class.slice(0,16) == 'ui-state-default'){
                let selectedDay = $(event.target).attr('data-date');
                let selectedMonth = $(event.target).parent().attr('data-month');      // month is 0-indexed
                let selectedYear = $(event.target).parent().attr('data-year');
                $("#form-new_date").append("<input hidden type='text' name='new_y' value='" + selectedYear + "'/>");
                $("#form-new_date").append("<input hidden type='text' name='new_m' value='" + selectedMonth + "'/>");
                $("#form-new_date").append("<input hidden type='text' name='new_d' value='" + selectedDay + "'/>");
                document.getElementById("form-new_date").submit();
            } else if (event_class.slice(0,7) != 'context'){
                $(".context_menu.wrapper").css('visibility', 'hidden');
                $('.context_task_text').css('visibility', 'hidden');
                $("#context_submit_task").css('visibility', 'hidden');
                $("#context_submit_project").css('visibility', 'hidden');
                if (window_width > 750){ $("#span_username").css('background-color', 'rgb(15,3,44)') }
                else{ $("#span_username").css('background-color', 'rgb(20,10,80)') };
                $("#span_username").css('border-bottom-left-radius', '5px');
                $("#span_username").css('border-bottom-right-radius', '5px');
                if (event_class.slice(0,3) != 'obs'){
                    $(".obs-box").css('visibility', 'hidden');
                }
            }
        } else if ($(event.target).is('input')) {
        } else{
            $(".context_menu.wrapper").css('visibility', 'hidden');
            $(".context_menu.wrapper").css('top', 0);
            $(".context_menu.wrapper").css('left', 0);
            $('.context_task_text').css('visibility', 'hidden');
            $(".obs-box").css('visibility', 'hidden');
            $("#context_submit_task").css('visibility', 'hidden');
            if (window_width > 750){ $("#span_username").css('background-color', 'rgb(15,3,44)') }
            else{ $("#span_username").css('background-color', 'rgb(20,10,80)') };
            $("#span_username").css('border-bottom-left-radius', '5px');
            $("#span_username").css('border-bottom-right-radius', '5px');
        }
    });

    if ($('.project').length > 0){
        $('#projects_section').css('background-color', 'transparent')
    }

    async function adjustProjectsLayout(){        
        let projects = $('.tasks');
        let specific_tasks = $('.specific_task');
        let tasks_with_lines = $('.task_with_lines');
        for (let m = 0; m < projects.length; m++){
            function shrinkTasks(in_obj){
                if ($(in_obj).width() > window_width - 12){
                    $(in_obj).css('flex-wrap', 'wrap');
                    return(true)
                };
                let these_tasks = $(in_obj).find('.specific_task');
                for (let a = 0; a < these_tasks.length; a++){
                    if ($(these_tasks[a]).height() > $(these_tasks[a]).width()){
                        $(in_obj).css('flex-wrap', 'wrap');
                        return(true)
                    }
                };
                for (let a = 0; a < these_tasks.length; a++){
                    if ( $($(these_tasks[a]).siblings('.line')[0]).width() < 6 ){
                        $(in_obj).css('flex-wrap', 'wrap');
                        return(true)
                    }
                };
                return(false)
            };
            if (shrinkTasks(projects[m])){
                setTimeout(function(){
                    for (let i = 1; i < tasks_with_lines.length; i++){
                        let element_before = tasks_with_lines[i-1];
                        let element_after = tasks_with_lines[i];
                        var rect_before = element_before.getBoundingClientRect();
                        var rect_after = element_after.getBoundingClientRect();
                        if ( ($(element_after).parent()[0] == $(element_before).parent()[0]) && rect_before.x > rect_after.x && rect_before.y < rect_after.y){
                            $($(element_before).children('.line')[1]).css('border', 'none');
                            $($(element_after).children('.line')[0]).css('border', 'none');
                        }
                    }
                },12);
            }
        };
        for (let l = 0; l < projects.length; l++){      // changes width to 95% if there's no project deadline
            if( !$(projects[l]).siblings('.final_deadline-box').html() ){
                let this_project = projects[l];
                $(this_project).css('width', '95%');
                $($($(this_project).children()[($(this_project).children().length)-1]).children()[2]).css('border', 'none')
            }
        };
        for (let r = 0; r < specific_tasks.length; r++){
            let this_task = specific_tasks[r];
            let this_task_mili = new Date($($(this_task).children('.task-deadline-YYYY-MM-DD')[0]).html() + tmz_suffix).getTime();
            if ( this_task_mili < new Date().getTime() && $(this_task).hasClass('todo') ){
                $(this_task).css('background-color', 'rgb(10,10,10)');
                $(this_task).css('border', '2px solid rgb(40,40,40)');
                let this_lines = $(this_task).siblings('.line');
                $(this_lines).css('border', '1px solid rgb(40,40,40)');
            } else if ( this_task_mili < 172800000 + new Date().getTime() && $(this_task).hasClass('todo') ){
                $(this_task).css('background-color', 'rgb(110,0,0)');
                $(this_task).css('border', '2px solid red');
                let this_lines = $(this_task).siblings('.line');
                $(this_lines).css('border', '1px solid red');
                $(this_task).css('color', 'rgb(230,230,230)');
            } else if ( this_task_mili < 432000000 + new Date().getTime() && $(this_task).hasClass('todo') ){
                $(this_task).css('background-color', 'rgb(90,40,0)');
                $(this_task).css('border', '2px solid rgb(240,110,0)');
                let this_lines = $(this_task).siblings('.line');
                $(this_lines).css('border', '1px solid rgb(240,110,0)');
                $(this_task).css('color', 'rgb(230,230,230)');
            } else if ( this_task_mili < 864000000 + new Date().getTime() && $(this_task).hasClass('todo') ){
                $(this_task).css('background-color', 'rgb(90,90,0)');
                $(this_task).css('border', '2px solid rgb(200,200,0)');
                let this_lines = $(this_task).siblings('.line');
                $(this_lines).css('border', '1px solid rgb(200,200,0)');
                $(this_task).css('color', 'rgb(230,230,235)');
            }
        };
        for (let j = 0; j < projects.length; j++){      // sets project´s title border to green if the first task is done
            let color = "2"+(($($($(projects[j]).children()[0]).children('.line')[0]).css('border')).slice(1,));
            $($('.project_title')[j]).css('border-left', `${color}`)
        }
    };
    adjustProjectsLayout();

    $('.auxiliar_note').hide();
    $('input').on("keyup",function() {
        let maxLength = $(this).attr("maxlength");
        if (!maxLength){ return };
        let positioning = this.getBoundingClientRect();
        
        if(maxLength == $(this).val().length) {
            let this_id = $(this).attr('id');
            if ( this_id == 'new_project_title' || this_id == 'context_project_title' ){
                $('#max_char_title').css('top', positioning.top + window.scrollY);
                $('#max_char_title').css('left', `${positioning.right}px`);
                $('#max_char_title').show();
                $('#max_char_title').on('click', function(){ $('#max_char_title').hide() });
                setTimeout(() => {
                    $('#max_char_title').hide()
                }, 4000)
            } else{
                $('#max_char_task').css('top', positioning.top + window.scrollY);
                $('#max_char_task').css('left', positioning.right);
                $('#max_char_task').show();
                $('#max_char_task').on('click', function(){ $('#max_char_task').hide() });
                setTimeout(function(){
                    $('#max_char_task').hide()
                },7000)
            }
        }
    });

    if (window.innerWidth > 720){
        let day1length = $('#day1 '+period_of_day_class).find('.added_note').length;
        let day2length = $('#day2 '+period_of_day_class).find('.added_note').length;
        $('.main-container').css('max-height', `${ ($('#hero-greeting').height() + $('#day1').height() + $("#next_events").height() + $('#projects_section').height() +50 ) }px`);
        if (window.innerWidth > 975) {
            if (window.innerWidth > 1190){ $('#day2 h5').css('padding-left','14%') };
            if ( day1length > 2 && day1length >= day2length * 3){
                $('.main-container').css('grid-template-columns', '1fr 0.68fr');
                $($('#day1 '+period_of_day_class).find('.notes-box')).css('grid-template-columns', '1fr 1fr 1fr');
                $('#day2 h5').css('padding-left','5%');
                $('#day2 h5').css('font-size','1.2em');
            } else if ( day2length > 2 && day2length >= day1length * 3){
                $('.main-container').css('grid-template-columns', '0.68fr 1fr');
                $($('#day2 '+period_of_day_class).find('.notes-box')).css('grid-template-columns', '1fr 1fr 1fr')
            }
        } else{
            $('#day2 h5').css('padding-left','5%');
            if ( day1length > 2 && day1length >= day2length * 3){
                $('#day2 h5').css('padding-left','0px');
                $('#day2 h5').css('width','85%');
                $('#right_arrow').css('width','15%');
                $('.main-container').css('grid-template-columns', '1fr 0.68fr');
                $($('#day2 '+period_of_day_class).find('.notes-box')).css('grid-template-columns', '1fr');
                $($('#day2 '+period_of_day_class).find('h5')).css('font-size', '1em');
            } else if ( day2length > 2 && day2length >= day1length * 3){
                $('.main-container').css('grid-template-columns', '0.68fr 1fr');
                $($('#day1 '+period_of_day_class).find('.notes-box')).css('grid-template-columns', '1fr');
                $($('#day1 '+period_of_day_class).find('h5')).css('font-size', '1em');
            }
        }
    };

    if (window.innerWidth > 750){
        if (window.innerWidth > 974){
            for (let p = 4; p < $($("#next_7_days").children()).length; p += 5 ){
                if ( $("#next_7_days").children()[p] ){
                    $($("#next_7_days").children()[p]).css('width','20%')
                    $($("#next_7_days").children()[p]).css('margin-right', 0)
                } else{ break }
            };
            for (let p = 4; p < $($("#next_30_days").children()).length; p += 5 ){
                if ( $("#next_30_days").children()[p] ){
                    $($("#next_30_days").children()[p]).css('width','20%');
                    $($("#next_30_days").children()[p]).css('margin-right', 0)
                } else{ break }
            }
        } else{
            for (let p = 2; p < $($("#next_7_days").children()).length; p += 3 ){
                if ( $("#next_7_days").children()[p] ){
                    $($("#next_7_days").children()[p]).css('width','33.4%');
                    $($("#next_7_days").children()[p]).css('margin-right', 0)
                } else{ break }
            }
            for (let p = 2; p < $($("#next_30_days").children()).length; p += 3 ){
                if ( $("#next_30_days").children()[p] ){
                    $($("#next_30_days").children()[p]).css('width','33.4%');
                    $($("#next_30_days").children()[p]).css('margin-right', 0)
                } else{ break }
            }
        }
    };

    $("#logout-box").on({
        mouseover : () => {
            let show = true;
            $("#logout-box").on("mouseleave", ()=>{
                $("#logout_note").fadeOut(150);
                show = false
            })
            setTimeout(() => {
                if (show){
                    $("#logout_note").css('top','60px');
                    $("#logout_note").css('left',`${window.innerWidth - 100}px`);
                    $("#logout_note").fadeIn(150);
                    setTimeout(()=>{
                        $("#logout_note").fadeOut(150);
                    },2000)
                } else{ return }
            }, 1000);
        },
        mousedown : () => { $(this).css('color', 'rgb(240,240,206)') },
        click : () => { document.getElementById("logout-form").submit() }
    });

    if( ($('#next_30_days').children('.specific_next_event')).length == 1 ){
        $($('#next_30_days').children('.specific_next_event')).css('margin-bottom', '14px')
    };

    function userSettings(event){
        //let pos_x = user_object.clientX, pos_y = event.clientY;
        const this_object = event.target;
        let acc_menu = $("#manage_acc");
        $(this_object).css('background-color', 'rgb(5,5,5)');
        $(this_object).css('border-bottom-left-radius', '0');
        $(this_object).css('border-bottom-right-radius', '0');
        const day1 = $("#day1")[0];
        if (day1.offsetTop < $("#day2")[0].offsetTop){
            acc_menu.css('top', `${this_object.offsetTop + this_object.offsetHeight -3}px`);
            acc_menu.css('margin-left', `${day1.offsetLeft}px`);
            acc_menu.css('width', `${day1.offsetWidth}px`);
            $("#manage_acc .context_menu").css('width', '100%');
            acc_menu.css('visibility', 'visible'); acc_menu.hide()
        } else{
            acc_menu.css('top', `${this_object.offsetTop + this_object.offsetHeight}px`);
            acc_menu.css('left', `${this_object.offsetLeft-40}px`);
            if (day1.offsetWidth > 400){
                acc_menu.css('width', `${day1.offsetWidth}px`)
            } else{
                acc_menu.css('width', '400px')
            };
            $("#manage_acc .context_menu").css('width', '100%');
            acc_menu.css('visibility', 'visible'); acc_menu.hide();
        };
        acc_menu.slideDown(100, 'linear');
        if ($("#new_pw_conf").val() == ""){ $("#new_pw_conf_tr").hide() }
    };
    $("#new_pw").on('keydown', (e)=>{
        setTimeout(() => {
            if($(e.target).val().length){ $("#new_pw_conf_tr").slideDown(100) }
            else{ $("#new_pw_conf_tr").slideUp(100) }
        }, 10);
    });
    
    $("#span_username").on('click', (e)=>{ userSettings(e) });
    $("#span_username").on('contextmenu', (e)=>{ e.preventDefault(); userSettings(e) });

    $("#submit_acc").on('click', ()=>{
        let checker = 0;
        let first_name = $("#acc_firstname").val();
        let surname = $("#acc_surname").val();
        let email = $("#acc_useremail").val();
        let phone = $("#acc_userphone").val();
        let lang = $("#acc_lang").val();
        if (inputChecker(first_name, true) && first_name.length > 1 && first_name.length < 21){
            checker += 1;       //1
        } else{ alert("Invalid first name"); return };
        if (surname == "" || inputChecker(surname, true)){
            checker += 1;       //2
        } else{ alert("Invalid surname"); return };
        if (email == "" || (inputChecker(email) && email.length > 6 && email.length < 81)){
            checker += 1;       //3
        } else{ alert("Invalid e-mail"); return };
        if (phone == "" || (phoneChecker(phone) && phone.length > 5 && phone.length < 31)){
            checker += 1;       //4
        } else{ alert("Invalid phone number"); return };
        if (lang == "" || (inputChecker(lang) && lang.length == 3)){
            checker += 1;       //5
        } else{ alert("Invalid language"); return };
        if ($("#new_pw").val() == "" || (inputChecker($("#new_pw").val()) && $("#new_pw").val().length > 4 && $("#new_pw").val().length < 40)){
            checker += 1;       //6
        } else{ alert("Invalid new password"); return };
        if (($("#new_pw").val() == "" && $("#new_pw_conf").val() == "") || (inputChecker($("#new_pw_conf").val()) && $("#new_pw_conf").val().length > 4 && $("#new_pw_conf").val().length < 40)){
            checker += 1;       //7
        } else{ alert("Invalid new password confirmation"); return };
        if ($("#new_pw_conf").val() == $("#new_pw").val()){
            checker += 1;       //8
        } else{ alert('The new password must be the same in both fields: "New password" and "again"'); return };
        if ($("#acc_curr_pw").val().length){
            checker += 1;       //9
        } else{
            let top_pos = $("#submit_acc")[0].offsetTop;
            let left_pos = $("#span_username")[0].offsetLeft;
            $("#curr_pw_required").css('top',`${top_pos+20}px`);
            $("#curr_pw_required").css('left',`${window.innerWidth/2 - 100}px`);
            $("#curr_pw_required").show();
            $("#acc_pw_label").css('color', 'red');
            $("#acc_curr_pw").css('color', 'red');
            setTimeout(() => {
                $("#curr_pw_required").hide();
            }, 3000);
            return
        };
        if (inputChecker($("#acc_curr_pw").val())){
            checker += 1;       //10
        } else{ alert("Invalid current password"); return };
        if (checker == 10){
            let arr_with_values = [first_name, surname, email, phone, lang, $("#new_pw").val(), $("#acc_curr_pw").val()];
            let string_to_submit = JSON.stringify(arr_with_values);
            let param = "<input hidden type='text' name='acc_changes' value='" + string_to_submit + "'/>";
            $("#form-acc_changes").append(param);
            param = string_to_submit = arr_with_values = 0;
            new_date = new Date();
            local_hour = new_date.getHours();
            UTC_hour = new_date.getUTCHours();
            let string_hour_lat_lon = JSON.stringify([local_hour, UTC_hour, new_date.getTime(), new_date.toString()]);
            let param_hour = "<input hidden type='text' name='user_hour_timestamp' value='" + string_hour_lat_lon + "'/>";
            $("#form-acc_changes").append(param_hour);
            document.getElementById("form-acc_changes").submit()
        } else{ return }
    });

    $('#delete_acc').on('click', function(){
        $($('.confirm_deletion_box')[1]).css({'top' : `${window.scrollY + (window.innerHeight/3)}px`});
        $($('.confirm_deletion_box')[1]).css({'left' : 0});
        $($('.shade_project_box')[2]).css('visibility', 'visible');
        $($('.confirm_deletion_box')[1]).css('visibility', 'visible');
        $('#confirm_deletion_button_acc').on('click', function(){            
            let param = "<input hidden type='text' name='delete_acc' value=1/>";
            $("#form-project").append(param);
            document.getElementById("form-project").submit()
        });
        $('#cancel_deletion_button_acc').on('click', function(){
            $('.shade_project_box').css('visibility', 'hidden');
            $('.confirm_deletion_box').css('visibility', 'hidden');
            return
        });
    });

    if(window.innerWidth < 410){ $("#new_pw").css('letter-spacing', '-1.7px') };

    setTimeout(() => {
        if (($("#wtr_simple").html()) == "true" || ($("#wtr_simple").html()) == true){
            $(".hour_hour_weather").hide();
            $(".max_min_temp").hide();
            $("#show_simpl").hide();
            $("#next_6_hours").hide();
            $(".hour_hour_weather").css('margin', '0 7px');
            $(".hourly_weather").css('margin-bottom', '5px')
        } else{ $("#show_compl").hide() }
        console.log('hour offset is:', $("#hour_offset").html());
        console.log('tmz suffix is:', $("#tmz_suffix").html())
    }, 13);
    
});